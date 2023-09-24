const total_width = document.getElementById("timeslider").clientWidth;
const margin = {top: 5, right: 30, bottom: 5, left: 30};
const width = total_width - margin.left - margin.right;
const height = 120 - margin.top - margin.bottom;
const VALUE = "spatiotemporal_torque"

const svg_bottom = d3
    .select('div#temporalChartLine')
    .append('svg')
    .attr('width', total_width)
    .attr('height', 120)
    .append('g')
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

const svg_right = d3.select("div#ChartBar")


var x = d3.scaleBand()
  .range([ 0, width ])
  .domain(Array(1024).fill().map((_, i) => i))
  .padding(0.01);
svg_bottom.append("g")
  .attr("transform", "translate(0," + height + ")")
  .call(d3.axisBottom(x))


d3.csv("/static/data/data_diff_half.csv", d3.autoType)
    .then(function(data) {
        var y = d3.scaleBand()
            .range([ height, 0 ])
            .domain([...new Set(data.map(d => d.t))]) 
            .padding(0.01);
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
            //.style("position", "relative")

            // Three function that change the tooltip when user hover / move / leave a cell
            var mouseover = function(d) {
                d3.select(this).style("stroke", "black");
                tooltip.style("opacity", 1)
            }
            var mousemove = function(event, d) {
            tooltip
                .html("Torque:" + Math.round(d[VALUE] * 100) / 100 + "<br/>" + "Timestamp:" + Math.round(d.t))
                .style("left", (d3.pointer(event)[0] + 40)+ "px")
                .style("top", (d3.pointer(event)[1] + 40) + "px")
            }
            var mouseleave = function(d) {
                d3.selectAll(".cell").style("stroke", "none");
            tooltip.style("opacity", 0)
            }
        
        var myColor = d3.scaleLinear()
            .range(["white", "#ee0000"])
            .domain(d3.extent(data, d => d[VALUE]))

        svg_bottom.selectAll()
            .data(data)//, function(d) {return d.group+':'+d.variable;})
            .enter()
            .append("rect")
            .attr("class", "cell")
            .attr("x", function(d) { return x(d.pos) })
            .attr("y", function(d) { return y(d.t) })
            .attr("width", x.bandwidth() )
            .attr("height", y.bandwidth() )
            .style("fill", function(d) { return myColor(d[VALUE])} )
            .on("mouseover", mouseover)
            .on("mousemove", mousemove)
            .on("mouseleave", mouseleave)
            .on("click", function(event, d) {
                map.setView(new L.LatLng(d.lat, d.lon), 9);
                sliderTime.value(d.t * 2);
            })
    });