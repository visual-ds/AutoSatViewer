function LoadProj() {
    var url = `/get_projection`;
    $.ajax({
        url: url,
        type: "GET",
        success: function (data) {
            d3.select("#projScatterSVG").remove();
            var columns = Object.keys(data[0]).filter(d => d != "id_poly" && d != "x" && d != "y" && d != "color");
            DrawProjection(data, columns);
        }
    })
}

function DrawProjection(data, columns) {
    const fullHeight = 280;
    const fullWidth = 280;

    const threshold = $("#threshold").val();
    var quantile = {}
    for (let i = 0; i < columns.length; i++) {
        var signal = columns[i];
        quantile[signal] = d3.quantile(
            data.map(d => d[signal]), threshold
        )
    }

    var verifyHigh = function (d) {
        var high = false;
        for (let i = 0; i < columns.length; i++) {
            var signal = columns[i];
            if (d[signal] > quantile[signal]) {
                high = true;
                break;
            }
        }
        return high;
    }

    var svg = d3.select("#projection_scatter")
        .append("svg")
        .attr("id", "projScatterSVG")
        .attr("width", fullWidth)
        .attr("height", fullHeight);

    var margin = { top: 30, right: 20, bottom: 15, left: 15 },
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
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${height})`);

    const gy = gAll.append("g")
        .attr("class", "y-axis");

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
        .attr("class", d => verifyHigh(d) ? "projDot highlight" : "projDot")
        .attr("r", 4)
        .attr("cx", d => x(d.x))
        .attr("cy", d => y(d.y))
        .style("fill", d => d.color)// "#0047ab")
        .style("stroke", "none")
        .style("stroke-width", 2)
        //.style("opacity", 0.6);
        .style("opacity", d => verifyHigh(d) ? 1 : 0.05);

    gx.call(xAxis, x);
    gy.call(yAxis, y);

    gAll.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("height", height)
        .attr("width", width)
        .style("stroke", "gray")
        .style("fill", "transparent")
        .style("stroke-width", 1);

    var brush = d3.brush()
        .extent([[0, 0], [width, height]])
        .on("end", brushed)
    //.on("end", brushend);
    gAll.call(brush);


    function brushed({ selection }) {
        if (selection === null) {
            gDot.selectAll("circle").classed("selected_proj", false);
            gDot.selectAll("circle").style("stroke", "none");
            updateSpatialHighlight([]);
            LoadTimeSeries([]);

            return;
        }
        const [[x0, y0], [x1, y1]] = selection;
        function verify(x, y) {
            return x0 <= x && x <= x1 && y0 <= y && y <= y1;
        }
        gDot.selectAll(".projDot.highlight")
            .classed("selected_proj", d => verify(x(d.x), y(d.y)));

        var dataHighlight = data.map(d => {
            d_ = { ...d }
            d_["highlight"] = false;
            if (verify(x(d.x), y(d.y))) {
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

        var selected_polys = dataHighlight.filter(d => d.highlight).map(d => d.id_poly);
        LoadTimeSeries(selected_polys);
    }



}