function MultivariateTimeSeries_Individual(DivID, data, dataNeighbors, Column, color) {
    const miDiv = document.getElementById(DivID);

    const viz_width = miDiv.offsetWidth,
        viz_height = miDiv.offsetHeight;

    const margin = { top: 20, right: 5, bottom: 30, left: 20 },
        width = viz_width - margin.left - margin.right,
        height = viz_height - margin.top - margin.bottom;

    data.forEach(d => { d.date = new Date(d.date) });
    dataNeighbors.forEach(d => { d.date = new Date(d.date) });
    d3.select("#" + DivID).selectAll("svg").remove();

    const svg = d3.select("#" + DivID).append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


    const x = d3.scaleTime().range([0, width]).domain(d3.extent(data, d => d.date)),
        y = d3.scaleLinear().range([height, 0]).domain([0, Math.max(d3.max(data, d => d[Column]), d3.max(dataNeighbors, d => d[Column]))]);

    const line = d3.line()
        .x(d => x(d.date))
        .y(d => y(d.value))
        .curve(d3.curveNatural);

    svg.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x).tickFormat(d3.timeFormat("%m/%Y")).ticks(6))
        .selectAll("g")
        .append("line") // Añadir líneas verticales
        .style('stroke', '#E3E9ED')
        .attr("y2", -height);

    svg.append("g")
        .attr("class", "axis")
        .call(d3.axisLeft(y).ticks(6))
        .selectAll("g")
        .append("line") // Añadir líneas verticales
        .style('stroke', '#E3E9ED')
        .attr("x2", width);

    svg.append("path")
        .data([dataNeighbors])
        .attr("class", "line")
        .style("stroke", "#606060")
        .style("fill", "none")
        .style('stroke-width', 2)
        .attr("d", line.y(d => y(d[Column])));

    svg.append("path")
        .data([data])
        .attr("class", "line")
        .style("stroke", color)
        .style("fill", "none")
        .style('stroke-width', 2)
        .attr("d", line.y(d => y(d[Column])));


    const legend = svg.append("g")
        .attr("class", "legend")
    //.attr("transform", "translate(0," + + ")");

    // legend.append("rect")
    //     .attr("x", width - 18)
    //     .attr("width", 18)
    //     .attr("height", 18)
    //     .style("fill", color);

    legend.append("text")
        .attr("x", width - 30)
        .attr("y", 5)
        .attr("dy", ".35em")
        .style("text-anchor", "end")
        .text(d => d);

}

function MultivariateTimeSeriesSmallMultiples(DivID, data, dataNeighbors, columns) {
    const container = d3.select('#' + DivID);

    container.selectAll('*').remove();

    const color = d3.scaleOrdinal()
        .domain(columns)
        .range(["#2CA599"]); //, "#1DA2D0", "#EF8C38", "#C74F61"]);

    // Crea nuevos divs para cada elemento en la lista de datos
    const divs = container.selectAll('div')
        .data(columns) // Enlaza los datos a los nuevos divs que se crearán
        .enter() // Por cada dato sin un div correspondiente, prepara la creación de un div
        .append('div') // Agrega un div por cada dato
        .attr('id', d => 'id_temporal' + d.replace(/\s/g, ''))
        .attr('class', 'simpleTemporalChart')
        .each(function (d, i) {
            MultivariateTimeSeries_Individual('id_temporal' + d.replace(/\s/g, ''), data, dataNeighbors, d, color(d));
        })
}

function LoadTimeSeries(id) {
    var selectedSignals = [];
    signalTypes.forEach(signal => {
        if (document.getElementById(signal).checked) {
            selectedSignals.push(signal);
        }
    });
    $.ajax({
        url: '/get_time_series',
        data: { 'block_id': id, 'signals': selectedSignals },
        type: 'POST',
        success: function (response) {
            var data = JSON.parse(response);
            console.log(data)
            MultivariateTimeSeriesSmallMultiples('TemporalMultivariateDiv', data.temporal, data.neighbors, data.columns)
        },
        error: function (error) {
            console.log(error);
        }
    });
}