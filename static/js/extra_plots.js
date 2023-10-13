const margin = {top: 10, right: 30, bottom: 20, left: 30};

const total_height_right = document.getElementById("timeslider").offsetHeight * 0.9;
const total_width_right = 250;
const width_right = total_width_right - margin.left - margin.right;
const height_right = total_height_right - margin.top - margin.bottom;
const HEATMAP_ATTR = "spatiotemporal_torque";


const total_width_bottom = window.innerWidth * 0.17;
const total_height_bottom = (window.innerHeight - 250) * 0.47;
const width_bottom = total_width_bottom - margin.left - margin.right;
const height_bottom = total_height_bottom - margin.top - margin.bottom;
const X_ATTR = "spatial_torque";
const Y_ATTR = "temporal_torque";

const svg_right = d3
    .select('div#temporalChartLine')
    .append('svg')
    .attr('width', total_width_right)
    .attr('height', total_height_right)
    .append('g')
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

const svg_bottom = d3.select("div#ScatterPlot")
    .append('svg')
    .attr('width', width_right + margin.left + margin.right)
    .attr('height', height_right + margin.top + margin.bottom)
    .append('g')
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


function draw_heatmap(data){
    var x_overview = d3.scaleBand()
        .range([ 0, width_right *0.3])
        .domain(Array(d3.max(data, d => d.t) + 1).fill().map((_, i) => i));
    
    var x_detail = d3.scaleBand()
        .range([ 0, width_right *0.6])
        .domain(Array(d3.max(data, d => d.t) + 1).fill().map((_, i) => i));
    
    var y_overview = d3.scaleBand()
        .range([ height_right, 0 ])
        .domain(Array(d3.max(data, d => d.pos) + 1).fill().map((_, i) => i));
    var y_detail = d3.scaleBand()
        .range([height_right, 0])
        .domain(Array((d3.max(data, d => d.pos) + 1)/ 8).fill().map((_, i) => i));
    var y_overview_linear = d3.scaleLinear()
        .range([ height_right, 0 ])
        .domain([0, d3.max(data, d => d.pos)]);
    

    var myColor = d3.scaleLinear()
        .range(["white", "#ee0000"])
        .domain(d3.extent(data, d => d[HEATMAP_ATTR]));
    svg_right.append("g")
        .attr("transform", "translate(0," + height_right + ")")
        .call(d3.axisBottom(x_detail).tickValues([0, 5, 10, 15]));
    svg_right.append("g")
        .call(d3.axisLeft(y_overview_linear).tickValues(Array(8).fill().map((_, i) => i * 128)));

    var tooltip = d3.select("div#temporalChartLine")
        .append("div")
        .style("opacity", 0)
        .attr("class", "tooltip")
        .style("background-color", "white")
        .style("border", "solid")
        .style("border-width", "2px")
        .style("border-radius", "5px")
        .style("padding", "5px")
        .style("position", "absolute")
        .style("z-index", 5000)


    var mouseover = function(d) {
        d3.select(this).style("stroke", "black");
        tooltip.style("opacity", 1);
    }
    var mousemove = function(event, d) {
        tooltip
            .html("Torque:" + Math.round(d[HEATMAP_ATTR] * 100) / 100 + "<br/>" + "Timestamp:" + Math.round(d.t))
            .style("left", (d3.pointer(event)[0] + 40)+ "px")
            .style("top", (d3.pointer(event)[1] + 20) + "px");
    }
    var mouseleave = function(d) {
        d3.selectAll(".cell").style("stroke", "none");
        tooltip.style("opacity", 0)
        .style("left", "0px")
        .style("top", "0px");
    }
    var mouseclick = function(event, d) {
        map.setView(new L.LatLng(d.lat, d.lon), 9);
        sliderTime.value(d.t);
    }

    const brush = d3.brushY()
      .extent([[0, 0], [width_right*0.3, height_right]])
      .on("end", brushended);

    function brushended(event) {
        const selection = event.selection;
        if (!event.sourceEvent || !selection) return;

        var div = 8;
        var step = (y_overview_linear.domain()[1] - y_overview_linear.domain()[0] + 1)/div;
        var selection_invert = selection
            .map(d => y_overview_linear.invert(d))   // convert to domain value
            .map(d => Math.round(d / step) * step) // round to step
            .map(d => y_overview_linear(d))   // convert back to range value
            .sort(function(a, b){return a - b});
        // if they are the same, move one of them
        if (selection_invert[0] == selection_invert[1]) {
            if (selection_invert[1] >= y_overview_linear.range()[1]) {
                selection_invert[0] -= step;
            } else {
                selection_invert[1] += step;
            }
        }
        d3.select(this).call(brush.move, selection_invert);

        d3.selectAll(".cell_detail")
            .filter(d => d.pos < selection_invert[0] || d.pos > selection_invert[1])

        

    }


    svg_right.selectAll()
        .data(data)
        .enter()
        .append("rect")
        .attr("class", "cell")
        .attr("x", d => x_overview(d.t))
        .attr("y", d => y_overview(d.pos))
        .attr("width", x_overview.bandwidth() )
        .attr("height", y_overview.bandwidth() )
        .style("fill", d => myColor(d[HEATMAP_ATTR]))
        //.on("mouseover", mouseover)
        //.on("mousemove", mousemove)
        //.on("mouseleave", mouseleave)
        //.on("click", mouseclick)

    d3.csv(`/static/data/data_test_1.csv`, d3.autoType)
        .then(function(data) {
            svg_right.append("g")
                .attr("transform", "translate(" + width_right * 0.32 + ",0)")
                .selectAll()
                .data(data)
                .filter(d => d.pos > (1024 - 128))
                .enter()
                .append("rect")
                .attr("class", "cell_detail")
                .attr("x", d => x_detail(d.t))
                .attr("y", d => y_detail(d.pos))
                .attr("width", x_detail.bandwidth() )
                .attr("height", y_detail.bandwidth() )
                .style("fill", d => myColor(d[HEATMAP_ATTR]))
                // .on("mouseover", mouseover)
                // .on("mousemove", mousemove)
                // .on("mouseleave", mouseleave)
                // .on("click", mouseclick);
        });


    svg_right.append("g")
        .attr("class", "brush")
        .call(brush)
        .call(brush.move, [y_overview_linear.range()[1], y_overview_linear.range()[1] + 128]);
}

function draw_scatterplot(data) {
    var x = d3.scaleLinear()
        .range([ 0, width_bottom ])
        .domain(d3.extent(data, d => d[X_ATTR]));
    var y = d3.scaleLinear()
        .range([ height_bottom, 0 ])
        .domain(d3.extent(data, d => d[Y_ATTR]));
    var myColor = d3.scaleLinear()
        .range(["white", "#ee0000"])
        .domain(d3.extent(data, d => d[HEATMAP_ATTR]));
    svg_bottom.append("g")
        .attr("transform", "translate(0," + height_bottom + ")")
        .call(d3.axisBottom(x));
        svg_bottom.append("g")
        .call(d3.axisLeft(y));
        
    // var tooltip = d3.select("div#temporalChartLine")
    //     .append("div")
    //     .style("opacity", 0)
    //     .attr("class", "tooltip")
    //     .style("background-color", "white")
    //     .style("border", "solid")
    //     .style("border-width", "2px")
    //     .style("border-radius", "5px")
    //     .style("padding", "5px")
    //     .style("z-index", 5000)


    var mouseover = function(d) {
        d3.select(this).style("stroke", "black");
        //tooltip.style("opacity", 1);
    }
    var mousemove = function(event, d) {
        // tooltip
        //     .html("Torque:" + Math.round(d[HEATMAP_ATTR] * 100) / 100 + "<br/>" + "Timestamp:" + Math.round(d.t))
        //     .style("left", (d3.pointer(event)[0] + 40)+ "px")
        //     .style("top", (d3.pointer(event)[1] + 40) + "px");
    }
    var mouseleave = function(d) {
        d3.selectAll(".point").style("stroke", "none");
        //tooltip.style("opacity", 0);
    }
    var mouseclick = function(event, d) {
        map.setView(new L.LatLng(d.lat, d.lon), 9);
        sliderTime.value(d.t);
    }
    
    svg_bottom.selectAll()
        .data(data)
        .enter()
        .append("circle")
        .attr("class", "point")
        .attr("cx", d => x(d[X_ATTR]))
        .attr("cy", d => y(d[Y_ATTR]))
        .attr("r", 5)
        .attr("opacity", 0.5)
        .style("fill", d => myColor(d[HEATMAP_ATTR]))
        .on("mouseover", mouseover)
        .on("mousemove", mousemove)
        .on("mouseleave", mouseleave)
        .on("click", mouseclick)
}



d3.csv(`/static/data/data_test_3.csv`, d3.autoType)
    .then(function(data) {
        draw_heatmap(data);
        //draw_scatterplot(data);
    });