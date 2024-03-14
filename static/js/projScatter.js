function LoadProj(signal) {
    if (signal == undefined) {
        var signal = $("#signalMap").val();
    }
    var url = `/get_projection/${signal}`;
    $.ajax({
        url: url,
        type: "GET",
        success: function (data) {
            d3.select("#projScatterSVG").remove();
            DrawProjection(signal, data);
        }
    })
}

function DrawProjection(signal, data) {

    var threshold = $("#threshold").val();
    var quant = d3.quantile(data.map(d => d.mean_coeff), threshold);

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

    var xAxis = (g, x) => g.call(d3.axisBottom(x).tickValues([]));
    var yAxis = (g, y) => g.call(d3.axisLeft(y).tickValues([]));

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
        .attr("class", "projDot")
        .attr("r", 4)
        .attr("cx", d => x(d[signal + "_x"]))
        .attr("cy", d => y(d[signal + "_y"]))
        .style("fill", d => d.color)// "#0047ab")
        .style("stroke", "none")
        .style("stroke-width", 2)
        .style("opacity", d => d.mean_coeff > quant ? 0.85 : 0.05);

    var zoom = d3.zoom()
        .scaleExtent([1, 10])
        .on("zoom", zoomed);

    //svg.call(zoom).call(zoom.transform, d3.zoomIdentity);

    gx.call(xAxis, x);
    gy.call(yAxis, y);

    // add signal name at the top
    gAll.append("text")
        .attr("transform", "translate(" + (width / 2) + " ," + (-margin.top / 2) + ")")
        .style("text-anchor", "middle")
        .style("font-size", "13px")
        .text(signal);

    var brush = d3.brush()
        .extent([[0, 0], [width, height]])
        .on("start brush end", brushed);

    gAll.call(brush);

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

    function brushed({ selection }) {
        if (selection === null) {
            gDot.selectAll("circle").classed("selected_proj", false);
            gDot.selectAll("circle").style("stroke", "none");
            updateSpatialHighlight([]);

            return;
        }
        const [[x0, y0], [x1, y1]] = selection;
        function verify(x, y) {
            return x0 <= x && x <= x1 && y0 <= y && y <= y1;
        }
        gDot.selectAll("circle")
            .classed("selected_proj", d => verify(x(d[signal + "_x"]), y(d[signal + "_y"])) && d.mean_coeff > quant);

        var dataHighlight = data.map(d => {
            d_ = { ...d }
            d_["highlight"] = false;
            if (verify(x(d[signal + "_x"]), y(d[signal + "_y"])) && d.mean_coeff > quant) {
                d_["highlight"] = true;
            }
            return d_;
        })

        updateSpatialHighlight(dataHighlight);
        // update circles that have selected_proj class
        gDot.selectAll("circle")
            .style("stroke", "none");
        gDot.selectAll("circle.selected_proj")
            .style("stroke", "black")
            .style("stroke-width", 2);

    }
}