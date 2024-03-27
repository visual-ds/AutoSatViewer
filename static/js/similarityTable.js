function LoadTable() {
    var url = `/get_similarity_table`
    $.ajax({
        url: url,
        type: "GET",
        success: function (data) {
            DrawTable(data);
        }
    })
}

function DrawTable(data) {

    const element = d3.select('#similarity_table');
    const element2 = d3.select('#similarity_projection');
    const element3 = d3.select('#subtitle1');
    var signalMap = $("#signalMap").val();

    /*const fullHeight = 280;
    const fullWidth = 330;*/

    const fullWidth = element.node().clientWidth;
    const fullHeight = element.node().clientHeight;


    d3.select("#similarity_table").selectAll("svg").remove();
    var svg = d3.select("#similarity_table")
        .append("svg")
        .attr("id", "similaritySVG")
        .attr("width", fullWidth)
        .attr("height", fullHeight);

    var margin = { top: 60, right: 10, bottom: 10, left: 80 },
        width = fullWidth - margin.left - margin.right,
        height = fullHeight - margin.top - margin.bottom;

    var x = d3.scaleBand()
        .range([0, width])
        .domain(data.columns)
        .padding(0.1);

    var y = d3.scaleBand()
        .range([height, 0])
        .domain(data.columns)
        .padding(0.1);

    var gAll = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`)

    gAll.append("g")
        .attr("class", "x-axis")
        .call(d3.axisTop(x))
        .selectAll("text")
        .style("text-anchor", "start")
        .style('font-weight', d => d == signalMap ? "bold" : "normal")
        .style("fill", d => d == signalMap ? "#3c5663" : "#8FA2AC")
        .attr("transform", "rotate(-45)");

    // add yAxis with labels with the anchor at the end
    gAll.append("g")
        .attr("class", "y-axis")
        .call(d3.axisLeft(y))
        .selectAll("text")
        .style("text-anchor", "end")
        .style('font-weight', d => d == signalMap ? "bold" : "normal")
        .style("fill", d => d == signalMap ? "#3c5663" : "#8FA2AC");

    var colorScale = d3.scaleSequential(d3.interpolateRdYlBu)
        .domain([-0.9, 0.9]);

    var cells = gAll.selectAll('rect')
        .data(data.table)
        .enter()
        .append('g')
        .append('rect')
        .attr('x', d => x(d.row))
        .attr('y', d => y(d.column))
        .attr('width', x.bandwidth())
        .attr('height', y.bandwidth())
        .style('fill', d => colorScale(d.value));

    // add text
    gAll.selectAll('.rect_label')
        .data(data.table)
        .enter()
        .append('text')
        .attr('x', d => x(d.row) + x.bandwidth() / 2)
        .attr('y', d => y(d.column) + y.bandwidth() / 2)
        .attr('dy', '.35em')
        .attr('text-anchor', 'middle')
        .style('fill', d => Math.abs(d.value) > 0.3 ? 'white' : 'black')
        .text(d => d.value.toFixed(2))
        .style('z-index', 100);

    // add border
    gAll.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("height", height)
        .attr("width", width)
        .style("stroke", "gray")
        .style("fill", "transparent")
        .style("stroke-width", 1);
}