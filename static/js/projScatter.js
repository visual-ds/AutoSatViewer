function LoadProj() {
    var signal = signalTypes[0];
    var url = `/get_projection/${signal}`;
    $.ajax({
        url: url,
        type: "GET",
        success: function (data) {
            DrawProjection(signal, data);
        }
    })
}

function DrawProjection(signal, data) {

    console.log(signal, data)

    const fullHeight = 280;
    const fullWidth = 280;

    var svg = d3.select("#projection_scatter")
        .append("svg")
        .attr("id", "projScatterSVG")
        .attr("width", fullWidth)
        .attr("height", fullHeight);

    var margin = { top: 60, right: 20, bottom: 20, left: 20 },
        width = fullWidth - margin.left - margin.right,
        height = fullHeight - margin.top - margin.bottom;

    var x = d3.scaleLinear()
        .range([0, width])
        .domain([0, 1]);

    var y = d3.scaleLinear()
        .range([height, 0])
        .domain([0, 1]);

    var xAxis = (g, x) => g.call(d3.axisBottom(x).ticks(3));
    var yAxis = (g, y) => g.call(d3.axisLeft(y).ticks(3));

    var gAll = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const gx = gAll.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(0,${height})`);

    const gy = gAll.append("g")
        .attr("class", "axis");

    var clip = gAll.append("defs").append("clipPath")
        .attr("id", "clip_top")
        .append("rect")
        .attr("width", width)
        .attr("height", height)
        .attr("x", 0)
        .attr("y", 0);

    const gDot = gAll.append("g")
        .attr("clip-path", "url(#clip_top)");

    gDot.selectAll("dot")
        .data(data)
        .enter()
        .append("circle")
        .attr("r", 3)
        .attr("cx", d => x(d[signal + "_x"]))
        .attr("cy", d => y(d[signal + "_y"]))
        .style("fill", "#606060");

    var zoom = d3.zoom()
        .scaleExtent([1, 10])
        .on("zoom", zoomed);

    svg.call(zoom).call(zoom.transform, d3.zoomIdentity);

    function zoomed({ transform }) {
        const zx = transform.rescaleX(x);
        const zy = transform.rescaleY(y);
        gDot.selectAll("circle")
            .attr("cx", d => zx(d[signal + "_x"]))
            .attr("cy", d => zy(d[signal + "_y"]))
            .attr("r", 3 * transform.k);
        gx.call(xAxis, zx);
        gy.call(yAxis, zy);
    }
}