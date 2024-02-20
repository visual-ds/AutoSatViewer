
function MultivariateTimeSeries_Real(DivID, data, columns) {
    const miDiv = document.getElementById(DivID);

    const viz_width = miDiv.offsetWidth,
        viz_height = miDiv.offsetHeight;//* 0.9;

    const margin = { top: 20, right: 30, bottom: 30, left: 60 },
        width = viz_width - margin.left - margin.right,
        height = viz_height - margin.top - margin.bottom;

    data.forEach(d => { d.date = new Date(d.date) })
    d3.select("#" + DivID).selectAll("svg").remove();

    const svg = d3.select("#" + DivID).append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    const x = d3.scaleTime().range([0, width]).domain(d3.extent(data, d => d.date)),
        y = d3.scaleLinear().range([height, 0]).domain([0, d3.max(data, d => d3.max(columns.map(key => d[key])))]);

    const color = d3.scaleOrdinal()
        .domain(columns)
        .range(["#2CA599", "#1DA2D0", "#EF8C38", "#C74F61"]);
    const line = d3.line()
        .x(d => x(d.date))
        .y(d => y(d.value))
        .curve(d3.curveNatural);

    const variables = columns;

    svg.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x))
        .selectAll("g")
        .append("line") // Añadir líneas verticales
        .style('stroke', '#E3E9ED')
        .attr("y2", -height);

    svg.append("g")
        .attr("class", "axis")
        .call(d3.axisLeft(y));

    variables.forEach((variable, index) => {
        svg.append("path")
            .data([data])
            .attr("class", "line")
            .style("stroke", color(variable))
            .style("fill", "none")
            .style('stroke-width', 3)
            .attr("d", line.y(d => y(d[variable])));
    });

    // Leyenda
    const legend = svg.selectAll(".legend")
        .data(variables)
        .enter().append("g")
        .attr("class", "legend")
        .attr("transform", (d, i) => "translate(0," + i * 20 + ")");

    legend.append("rect")
        .attr("x", width - 18)
        .attr("width", 18)
        .attr("height", 18)
        .style("fill", color);

    legend.append("text")
        .attr("x", width - 24)
        .attr("y", 9)
        .attr("dy", ".35em")
        .style("text-anchor", "end")
        .text(d => d);
}

function Test_Ajax(id) {
    var selectedSignals = [];
    signalTypes.forEach(signal => {
        if (document.getElementById(signal).checked) {
            selectedSignals.push(signal);
        }
    });
    $.ajax({
        url: '/get_time_series',
        data: { 'block_id': id, 'signals': selectedSignals},
        type: 'POST',
        success: function (response) {
            var data = JSON.parse(response);
            console.log(data);
            MultivariateTimeSeries_Real('TemporalMultivariateDiv', data.temporal, data.columns)
        },
        error: function (error) {
            console.log(error);
        }
    });
}