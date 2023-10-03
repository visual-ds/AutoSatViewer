const total_width_bottom = document.getElementById("timeslider").clientWidth;
const margin = {top: 10, right: 30, bottom: 20, left: 30};
const width_bottom = total_width_bottom - margin.left - margin.right;
const height_bottom = 120 - margin.top - margin.bottom;
const HEATMAP_ATTR = "spatiotemporal_torque";


const total_width_right = window.innerWidth * 0.17;
const total_height_right = (window.innerHeight - 250) * 0.47;
const width_right = total_width_right - margin.left - margin.right;
const height_right = total_height_right - margin.top - margin.bottom;
const X_ATTR = "spatial_torque";
const Y_ATTR = "temporal_torque";

const svg_bottom = d3
    .select('div#temporalChartLine')
    .append('svg')
    .attr('width', total_width_bottom)
    .attr('height', 120)
    .append('g')
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

const svg_right = d3.select("div#ScatterPlot")
    .append('svg')
    .attr('width', width_right + margin.left + margin.right)
    .attr('height', height_right + margin.top + margin.bottom)
    .append('g')
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


function draw_heatmap(data){
    var x = d3.scaleBand()
        .range([ 0, width_bottom ])
        .domain(Array(d3.max(data, d => d.pos) + 1).fill().map((_, i) => i));
    var y = d3.scaleBand()
        .range([ height_bottom, 0 ])
        .domain(Array(d3.max(data, d => d.t) + 1).fill().map((_, i) => i));
    var myColor = d3.scaleLinear()
        .range(["white", "#ee0000"])
        .domain(d3.extent(data, d => d[HEATMAP_ATTR]));
    svg_bottom.append("g")
        .attr("transform", "translate(0," + height_bottom + ")")
        .call(d3.axisBottom(x).tickValues([]));
    svg_bottom.append("g")
        .call(d3.axisLeft(y).tickValues([0, 5, 10, 15]));
        
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
    
    svg_bottom.selectAll()
        .data(data)
        .enter()
        .append("rect")
        .attr("class", "cell")
        .attr("x", d => x(d.pos))
        .attr("y", d => y(d.t))
        .attr("width", x.bandwidth() )
        .attr("height", y.bandwidth() )
        .style("fill", d => myColor(d[HEATMAP_ATTR]))
        .on("mouseover", mouseover)
        .on("mousemove", mousemove)
        .on("mouseleave", mouseleave)
        .on("click", mouseclick)
}

function draw_scatterplot(data) {
    var x = d3.scaleLinear()
        .range([ 0, width_right ])
        .domain(d3.extent(data, d => d[X_ATTR]));
    var y = d3.scaleLinear()
        .range([ height_right, 0 ])
        .domain(d3.extent(data, d => d[Y_ATTR]));
    var myColor = d3.scaleLinear()
        .range(["white", "#ee0000"])
        .domain(d3.extent(data, d => d[HEATMAP_ATTR]));
    svg_right.append("g")
        .attr("transform", "translate(0," + height_right+ ")")
        .call(d3.axisBottom(x));
    svg_right.append("g")
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
    
    svg_right.selectAll()
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


d3.csv("/static/data/data_diff.csv", d3.autoType)
    .then(function(data) {

       
        draw_heatmap(data);
        
    
        draw_scatterplot(data);
    });