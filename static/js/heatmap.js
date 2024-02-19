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
        .style("stroke-width", "1px");

    //svg.append("g")
    //    .attr("transform", "translate(0," + height + ")")
    //    .call(d3.axisBottom(x));
    //svg.append("g")
    //    .call(d3.axisLeft(y));
}

const SIGNAL_TYPES = ["WazeAlerts", "FurtoCelular", "RouboCelular"];
const TIME_INTERVAL = "Month";
const POLY = "SpDistricts";
const N_SIGNALS = SIGNAL_TYPES.length;
const N_FREQS = 4;

function DrawOverview(data) {
    var margin = { top: 20, right: 20, bottom: 20, left: 20 },
        width = 960 - margin.left - margin.right,
        height = 150 - margin.top - margin.bottom;

    var heatmapPadding = 5;
    var heatmapHeight = (height - N_SIGNALS * heatmapPadding) / N_SIGNALS;

    var x = d3.scaleBand()
        .range([0, width])
        .domain(data.map(d => d.timestamp));

    var y = d3.scaleBand()
        .range([0, heatmapHeight])
        .domain(Array.from({ length: N_FREQS }, (v, k) => k));

    var colorScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.value)])
        .range(["#ffffff", "#ff0000"]);

    var svg = d3.select("#overview").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);

    for (let i = 0; i < N_SIGNALS; i++) {
        var g = svg.append("g")
            .attr("transform", "translate(" + margin.left + "," + (margin.top + i * (heatmapHeight + heatmapPadding)) + ")");
        var dataSignal = data.filter(d => d.type == SIGNAL_TYPES[i]);
        DrawOverviewHeatmap(g, dataSignal, x, y, colorScale);
    }
}