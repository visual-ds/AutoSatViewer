const signalTypes = ["WazeACCIDENT", "WazeHAZARD", "WazeJAM", "WazeROADCLOSED", "WazeWEATHERHAZARD", "FurtoCelular", "RouboCelular", "temperature", "precipitation"];

function LoadOverview() {
    var N_FREQS = $("#nFreqs").val();
    N_FREQS = Math.pow(2, N_FREQS);
    var THRESHOLD = $("#threshold").val();
    var selectedSignals = [];
    signalTypes.forEach(signal => {
        if (document.getElementById(signal).checked) {
            selectedSignals.push(signal);
        }
    });

    var url = `/get_heatmap_data/${N_FREQS}_${THRESHOLD}`
    for (let i = 0; i < selectedSignals.length; i++) {
        url += `_${selectedSignals[i]}`;
    }

    $.ajax({
        url: url,
        type: "GET",
        success: function (data) {
            d3.select("#heatmapSVG").selectAll("*").remove();
            DrawOverview(data);
        }
    })
}

function DrawOverview(data) {
    var N_FREQS = [...new Set(data.map(d => d.freq))].length;
    var SIGNAL_TYPES = [...new Set(data.map(d => d.type))];
    var N_SIGNALS = SIGNAL_TYPES.length;

    var margin = { top: 20, right: 20, bottom: 30, left: 130 },
        width = 960 - margin.left - margin.right,
        height = 150 - margin.top - margin.bottom;

    var heatmapPadding = 3;
    var heatmapHeight = (height - N_SIGNALS * heatmapPadding) / N_SIGNALS;

    var x = d3.scaleBand()
        .range([0, width])
        .domain(data.map(d => d.timestamp));



    var y = d3.scaleBand()
        .range([heatmapHeight, 0])
        .domain(Array.from({ length: N_FREQS }, (v, k) => k));

    var colorScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.value)])
        .range(["#ffffff", "#ff0000"]);

    var svg = d3.select("#heatmapSVG")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);

    for (let i = 0; i < N_SIGNALS; i++) {
        var g = svg.append("g")
            .attr("transform", "translate(" + margin.left + "," + (margin.top + i * (heatmapHeight + heatmapPadding)) + ")");
        var dataSignal = data.filter(d => d.type == SIGNAL_TYPES[i]);
        DrawOverviewHeatmap(g, dataSignal, x, y, colorScale, heatmapHeight);

        // add name of signal at the left
        g.append("text")
            .attr("y", heatmapHeight / 2)
            .attr("x", -10)
            .style("text-anchor", "end")
            .text(SIGNAL_TYPES[i]);

        if (i == N_SIGNALS - 1) {
            g.append("g")
                .attr("transform", "translate(0," + heatmapHeight + ")")
                .call(d3.axisBottom(x));
            g.append("text")
                .attr("transform", "translate(" + (width / 2) + "," + (heatmapHeight + 30) + ")")
                .style("text-anchor", "middle")
                .text("Timestamp");
        }
    }
}

function DrawOverviewHeatmap(g, data, x, y, colorScale) {
    g.selectAll("rect")
        .data(data)
        .enter()
        .append("rect")
        .attr("x", d => x(d.timestamp))
        .attr("y", d => y(d.freq))
        .attr("width", x.bandwidth())
        .attr("height", y.bandwidth())
        .style("fill", d => colorScale(d.value))
        .style("stroke", "#000000")
        .style("stroke-width", "1px")
        .on("click", function (event, d) {
            var timestamp = d.timestamp;
            var freq = d.freq;
            var type = d.type;
            $.ajax({
                url: `/get_high_coefficients/${d.type}_${d.timestamp}_${d.freq}`,
                type: "GET",
                success: async function (data) {
                    const response = await fetch('./static/data/SpCenterCensus10k.geojson');
                    var map_data = await response.json();
                    var selected_poly = data.map(d => d.id_poly);
                    console.log(data.map(d => d.value))
                    map_data.features = map_data.features.filter(d => selected_poly.includes(d.properties.id_poly));
                    map_data.features.forEach((d, i) => {
                        d.properties.freq = data[i].value;
                    })
                    // check if layer already exists
                    if (map.getLayer('selected_poly')) {
                        map.removeLayer('selected_poly');
                        map.removeSource('selected_poly');
                    }
                    map.addSource('selected_poly', {
                        type: 'geojson',
                        data: {
                            type: 'FeatureCollection',
                            features: map_data.features.filter(d => selected_poly.includes(d.properties.id_poly))
                        }
                    });
                    map.addLayer({
                        id: 'selected_poly',
                        type: 'fill',
                        source: 'selected_poly',
                        paint: {
                            //'fill-color': '#088',
                            'fill-color': ['interpolate-hcl', ['linear'], ['get', 'freq'], d3.min(data.map(d => d.value)), 'white', d3.max(data.map(d => d.value)), 'blue'],
                            'fill-opacity': 0.5
                        }
                    });
                }
            });
        });

    g.append("g")
        .call(d3.axisLeft(y).tickValues([]));
}
