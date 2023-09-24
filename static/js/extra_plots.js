const total_width_bottom = document.getElementById("timeslider").clientWidth;
const margin = {top: 5, right: 30, bottom: 5, left: 30};
const width_bottom = total_width_bottom - margin.left - margin.right;
const height_bottom = 120 - margin.top - margin.bottom;
const HEATMAP_ATTR = "spatiotemporal_torque";

const width_right = 200 - margin.left - margin.right;
const height_right = 400 - margin.top - margin.bottom;
const X_ATTR = "spatial_torque";
const Y_ATTR = "temporal_torque";

const svg_bottom = d3
    .select('div#temporalChartLine')
    .append('svg')
    .attr('width', total_width_bottom)
    .attr('height', 120)
    .append('g')
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

const svg_right = d3.select("div#ChartBar")
    .append('svg')
    .attr('width', width_right + margin.left + margin.right)
    .attr('height', height_right + margin.top + margin.bottom)
    .append('g')
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");



function draw_heatmap(data){
    var x = d3.scaleBand()
        .range([ 0, width_bottom ])
        .domain([...new Set(data.map(d => d.pos))]);
    var y = d3.scaleBand()
        .range([ height_bottom, 0 ])
        .domain([...new Set(data.map(d => d.t))]);
    var myColor = d3.scaleLinear()
        .range(["white", "#ee0000"])
        .domain(d3.extent(data, d => d[HEATMAP_ATTR]));
    svg_bottom.append("g")
        .attr("transform", "translate(0," + height_bottom + ")")
        .call(d3.axisBottom(x));
    svg_bottom.append("g")
        .call(d3.axisLeft(y));
        
    var tooltip = d3.select("div#temporalChartLine")
        .append("div")
        .style("opacity", 0)
        .attr("class", "tooltip")
        .style("background-color", "white")
        .style("border", "solid")
        .style("border-width", "2px")
        .style("border-radius", "5px")
        .style("padding", "5px")
        .style("z-index", 5000)


    var mouseover = function(d) {
        d3.select(this).style("stroke", "black");
        tooltip.style("opacity", 1);
    }
    var mousemove = function(event, d) {
        tooltip
            .html("Torque:" + Math.round(d[HEATMAP_ATTR] * 100) / 100 + "<br/>" + "Timestamp:" + Math.round(d.t))
            .style("left", (d3.pointer(event)[0] + 40)+ "px")
            .style("top", (d3.pointer(event)[1] + 40) + "px");
    }
    var mouseleave = function(d) {
        d3.selectAll(".cell").style("stroke", "none");
        tooltip.style("opacity", 0);
    }
    var mouseclick = function(d) {
        map.setView(new L.LatLng(d.lat, d.lon), 9);
        sliderTime.value(d.t * 2);
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
        d3.selectAll(".cell").style("stroke", "none");
        //tooltip.style("opacity", 0);
    }
    var mouseclick = function(d) {
        map.setView(new L.LatLng(d.lat, d.lon), 9);
        sliderTime.value(d.t * 2);
    }
    
    svg_bottom.selectAll()
        .data(data)
        .enter()
        .append("rect")
        .attr("class", "cell")
        .attr("cx", d => x(d[X_ATTR]))
        .attr("cy", d => y(d[Y_ATTR]))
        .attr("r", 4)
        .style("fill", d => myColor(d[HEATMAP_ATTR]))
        .on("mouseover", mouseover)
        .on("mousemove", mousemove)
        .on("mouseleave", mouseleave)
        .on("click", mouseclick)
}


d3.csv("/static/data/data_diff_half.csv", d3.autoType)
    .then(function(data) {

        // HEATMAP 
        draw_heatmap(data);
        
        // SCATTERPLOT
        draw_scatterplot(data);
    });