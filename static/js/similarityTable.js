function LoadTable() {
    var similarityType = "euclidean";
    // var selectedSignals = [];
    // signalTypes.forEach(signal => {
    //     if (document.getElementById(signal).checked) {
    //         selectedSignals.push(signal);
    //     }
    // });

    var url = `/get_similarity_table/${similarityType}`
    // for (let i = 0; i < selectedSignals.length; i++) {
    //     url += `_${selectedSignals[i]}`;
    // }
    $.ajax({
        url: url,
        type: "GET",
        success: function (data) {
            DrawTable(data);
        }
    })
}

function DrawTable(data) {

    const fullHeight = 280;
    const fullWidth = 330;

    var svg = d3.select("#similarity_table")
        .append("svg")
        .attr("id", "similaritySVG")
        .attr("width", fullWidth)
        .attr("height", fullHeight);

    var margin = { top: 60, right: 20, bottom: 20, left: 100 },
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
        .attr("transform", `translate(${margin.left},${margin.top})`);

    gAll.append("g")
        .attr("class", "x axis")
        .call(d3.axisTop(x))
        .selectAll("text")
        .style("text-anchor", "start")
        .attr("transform", "rotate(-45)");

    // add yAxis with labels with the anchor at the end
    gAll.append("g")
        .attr("class", "y axis")
        .call(d3.axisLeft(y))
        .selectAll("text")
        .style("text-anchor", "end");

    var q1 = d3.quantile(data.table.map(d => d.value).sort(d3.ascending), 0.25);
    var q3 = d3.quantile(data.table.map(d => d.value).sort(d3.ascending), 0.75);
    var q2 = (q1 + q3) / 2;

    var colorScale = d3.scaleSequential(d3.interpolateOranges)
        .domain([q1, q3]);

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
        .style('fill', d => d.value > q2 ? 'white' : 'black')
        .text(d => d.value.toFixed(2))
        .style('z-index', 100);
}