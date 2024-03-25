function LoadOverview() {
    var changeType = $("#changeType").val();
    var N_FREQS = $("#nFreqs").val();
    var THRESHOLD = $("#threshold").val();
    var url = `/get_heatmap_data/${changeType}_${N_FREQS}_${THRESHOLD}`

    $.ajax({
        url: url,
        type: "GET",
        success: function (data) {
            d3.select("#heatmap").selectAll("*").remove();
            data.forEach(d => {
                d.date = new Date(d.date);
            })
            DrawOverview(data);
            LoadProj();
        }
    })
}

function DrawOverview(data) {
    const element = d3.select('#heatmap');
    const parentWidth = element.node().clientWidth;
    const parentHeight = element.node().clientHeight - 70; // take 60 px reserved for color legend

    var N_FREQS = $("#nFreqs").val();
    var sharedScale = $("#sharedColor").is(":checked");
    var FreqsArray = [];
    for (let i = 1; i <= N_FREQS; i++) {
        FreqsArray.push(4 - i);
    }
    FreqsArray = FreqsArray.reverse();
    var MinFreq = 4 - N_FREQS;
    data = data.filter(d => d.freq >= MinFreq);
    var SIGNAL_TYPES = [...new Set(data.map(d => d.type))];
    var N_SIGNALS = SIGNAL_TYPES.length;
    var fullHeight = Math.min(50 * N_SIGNALS, parentHeight);


    setSlider(data);


    var margin = { top: 20, right: 30, bottom: 30, left: 100 },
        width = parentWidth - margin.left - margin.right;

    var datesArray = data.map(d => new Date(d.date).toString());
    datesArray = datesArray.filter((v, i, a) => a.indexOf(v) === i);
    datesArray = datesArray.map(d => new Date(d));

        height = fullHeight - margin.top - margin.bottom;

    var heatmapPadding = 3;
    var heatmapHeight = (height - N_SIGNALS * heatmapPadding) / N_SIGNALS;

    var x = d3.scaleTime()
        .range([0, width])
        .domain(d3.extent(data, d => d.date));

    var y = d3.scaleBand()
        .range([heatmapHeight, 0])
        .domain(FreqsArray)
        .padding(0.1);

    if (!sharedScale) {
        var maxValues = {};
        for (let i = 0; i < N_SIGNALS; i++) {
            var signal = SIGNAL_TYPES[i];
            maxValues[signal] = d3.max(data.filter(d => d.type == signal), d => d.value);
        }

        data.forEach(d => {
            d.value = d.value / maxValues[d.type];
        });
    }

    var colorScale = d3.scaleSequential(d3.interpolateGreens)
        .domain([0, d3.max(data, d => d.value)]);

    var svg = d3.select("#heatmap")
        .append("svg")
        .attr("id", "heatmapSVG")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);

    for (let i = 0; i < N_SIGNALS; i++) {
        var g = svg.append("g")
            .attr("transform", "translate(" + margin.left + "," + (margin.top + i * (heatmapHeight + heatmapPadding)) + ")");
        var dataSignal = data.filter(d => d.type == SIGNAL_TYPES[i]);
        DrawOverviewHeatmap(g, dataSignal, datesArray, x, y, colorScale, heatmapHeight);

        g.append("text")
            .attr("y", heatmapHeight / 2)
            .attr("x", -10)
            .style("text-anchor", "end")
            .text(SIGNAL_TYPES[i]);

        if (i == N_SIGNALS - 1) {
            g.append("g")
                .attr("transform", "translate(0," + heatmapHeight + ")")
                .call(d3.axisBottom(x).tickFormat(d3.timeFormat("%m/%d")))
            g.append("text")
                .attr("transform", "translate(" + (width / 2) + "," + (heatmapHeight + 30) + ")")
                .style("text-anchor", "middle")
                .text("Date");
        }
    }

    // add legend
    var legendNode = legend({
        color: colorScale,
        title: "Sum of high-frequency coefficients",
        width: 250,
        ticks: 6
    });

    /*var heatmapDiv = document.getElementById("heatmap");
    heatmapDiv.appendChild(legendNode);*/
    var legendDiv = document.getElementById('heatmapLegend');
    legendDiv.innerHTML = '';
    legendDiv.appendChild(legendNode);
}

function DrawOverviewHeatmap(g, data, datesArray, x, y, colorScale) {
    var minDistance = datesArray[1] - datesArray[0];

    var hoverTimeout;
    g.selectAll("rect")
        .data(data)
        .enter()
        .append("rect")
        .attr("class", d => "heatmapRect " + "rect" + d.type)
        .attr("x", d => x(d.date))
        .attr("y", d => y(d.freq))
        .attr("width", x(minDistance) - x(0))
        .attr("height", y.bandwidth())
        .style("fill", d => colorScale(d.value))
        .style("stroke", "#606060")
        .style("stroke-width", x(minDistance) - x(0) > 4 ? 0.5 : 0)
        .on("click", function (event, d) {
            // verify if there is any object of class .rect+d.type with the click class
            var clicked = d3.select(this).classed("click");
            var date = new Date(d.date);
            var date_idx = datesArray.findIndex(dateArray => dateArray.getTime() === d.date.getTime());
            var changeType = $("#changeType").val();

            if (clicked) {
                // verify if it is the current one clicked and remove
                //if (d3.select(this).classed("click")) {
                    d3.select(this)
                        .classed("click", false)
                        .transition()
                        .duration(1000)
                        .attr("y", d => y(d.freq))
                        .attr("height", y.bandwidth());

                    // remove click from server
                    $.ajax({
                        url: `/clean_high_coefficients/${d.type}_${date_idx}_${d.freq}_${changeType}`,
                        type: "GET",
                        success: async function (data) {
                            $("#slider").data("ionRangeSlider").update({ from: date_idx });
                            // trigger slider change
                            $("#signalMap").val(d.type);
                            $('#slider').data('ionRangeSlider').options.onChange();
                            var id_poly = data.filter(d => d.highlight).map(d => d.id_poly);
                            updateSpatialHighlight(id_poly.length > 0 ? data : []);

                            LoadTimeSeries(id_poly);
                        }
                    });

                //}
            } else {
                d3.select(this).classed("click", true);


                // create an animation of 0.5s of the height increasing
                d3.select(this)
                    .transition()
                    .duration(1000)
                    .attr("y", d => y(d.freq) - 5)
                    .attr("height", y.bandwidth() + 10);

                // add click to server
                $.ajax({
                    url: `/get_high_coefficients/${d.type}_${date_idx}_${d.freq}_${changeType}`,
                    type: "GET",
                    success: async function (data) {
                        $("#slider").data("ionRangeSlider").update({ from: date_idx });
                        // trigger slider change
                        $("#signalMap").val(d.type);
                        $('#slider').data('ionRangeSlider').options.onChange();
                        updateSpatialHighlight(data);
                        var id_poly = data.filter(d => d.highlight).map(d => d.id_poly);
                        LoadTimeSeries(id_poly);
                    }
                });
            }

        })
    // .on("click", function (event, d) {
    //     d3.select(this).classed("click", !d3.select(this).classed("click"));
    // })
    // .on("mouseover", function (event, d) {

    //     // verify that there isn't any other rect with the click class
    //     var clicked = d3.selectAll(".heatmapRect").filter(".click");
    //     if (clicked.size() > 0) {
    //         if (!d3.select(this).classed("click")) {
    //             return;
    //         }
    //     }

    //     clearTimeout(hoverTimeout);
    //     var date = new Date(d.date);
    //     var date_idx = datesArray.findIndex(dateArray => dateArray.getTime() === d.date.getTime());
    //     var changeType = $("#changeType").val();
    //     hoverTimeout = setTimeout(() => {
    //         $.ajax({
    //             url: `/get_high_coefficients/${d.type}_${date_idx}_${d.freq}_${changeType}`,
    //             type: "GET",
    //             success: async function (data) {
    //                 var idx = datesArray.findIndex(dateArray => dateArray.getTime() === d.date.getTime());
    //                 $("#slider").data("ionRangeSlider").update({
    //                     from: idx
    //                 });
    //                 // trigger slider change
    //                 $("#signalMap").val(d.type);
    //                 $('#slider').data('ionRangeSlider').options.onChange();

    //                 updateSpatialHighlight(data);
    //                 var id_poly = data.filter(d => d.highlight).map(d => d.id_poly);
    //                 LoadTimeSeries(id_poly);
    //             }
    //         });
    //     }, 1000);

    //     // create an animation of 0.5s of the height increasing
    //     d3.select(this)
    //         .transition()
    //         .duration(1000)
    //         .attr("y", d => y(d.freq) - 5)
    //         .attr("height", y.bandwidth() + 10);
    // })
    // .on("mouseleave", function (event, d) {
    //     if (d3.select(this).classed("click")) {
    //         return;
    //     }
    //     d3.select(this).interrupt();
    //     d3.select(this)
    //         .attr("y", d => y(d.freq))
    //         .attr("height", y.bandwidth());
    //     clearTimeout(hoverTimeout);
    //     var clicked = d3.selectAll(".heatmapRect").filter(".click");
    //     if (clicked.size() == 0) {
    //         updateSpatialHighlight([]);
    //     }
    // });

    g.append("g")
        .call(d3.axisLeft(y).tickValues([]));
}
