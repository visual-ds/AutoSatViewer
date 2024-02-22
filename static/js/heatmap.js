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
            d3.select("#heatmap").selectAll("*").remove();
            DrawOverview(data);
        }
    })
}

function DrawOverview(data) {
    var N_FREQS = [...new Set(data.map(d => d.freq))].length;
    var SIGNAL_TYPES = [...new Set(data.map(d => d.type))];
    var N_SIGNALS = SIGNAL_TYPES.length;
    var fullHeight = Math.min(60 * N_SIGNALS, 550);

    var margin = { top: 20, right: 20, bottom: 30, left: 130 },
        width = 600 - margin.left - margin.right,
        height = fullHeight - margin.top - margin.bottom;

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

    var svg = d3.select("#heatmap")
        .append("svg")
        .attr("id", "heatmapSVG")
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

    // add legend
    var legendNode = legend({
        color: colorScale,
        title: "Nº with changes",
        width: 330,
        marginLeft: margin.left,
    });

    var heatmapDiv = document.getElementById("heatmap");
    heatmapDiv.appendChild(legendNode);
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
        .on("mousemove", function (event, d) {
            $.ajax({
                url: `/get_high_coefficients/${d.type}_${d.timestamp}_${d.freq}`,
                type: "GET",
                success: async function (data) {
                    updateSpatialHighlight(data);
                }
            });
        })
        .on("mouseleave", function (event, d) {
            updateSpatialHighlight([]);
        });

    g.append("g")
        .call(d3.axisLeft(y).tickValues([]));
}
