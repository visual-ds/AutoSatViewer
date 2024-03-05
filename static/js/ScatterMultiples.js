function ScatterIndividual(DivID, data, Column, color) {
    const miDiv = document.getElementById(DivID);
    var signalMap = $("#signalMap").val();

    const viz_width = miDiv.offsetWidth,
        viz_height = miDiv.offsetHeight;

    const margin = { top: 20, right: 5, bottom: 30, left: 20 },
        width = viz_width - margin.left - margin.right,
        height = viz_height - margin.top - margin.bottom;

    data.forEach(d => { d.date = new Date(d.date) });

    d3.select("#" + DivID).selectAll("svg").remove();

    const svg = d3.select("#" + DivID).append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    const x = d3.scaleLinear()
        .range([0, width])
        .domain([-0.25, d3.max(data, d => d.high) + 0.25]);

    const y = d3.scaleLinear()
        .range([height, 0])
        .domain(d3.extent(data, d => d.mean_freq3));


    svg.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x).ticks(3));

    svg.append("g")
        .attr("class", "axis")
        .call(d3.axisLeft(y).ticks(3));


    svg.selectAll("dot")
        .data(data)
        .enter().append("circle")
        .attr("r", 3)
        .attr("cx", d => x(d.high))
        .attr("cy", d => y(d.mean_freq3))
        .style("fill", color);

    const legend = svg.append("g")
        .attr("class", "legend")

    legend.append("text")
        .attr("x", width / 2)
        .attr("y", -5)
        .attr("dy", ".35em")
        .style("text-anchor", "center")
        .style("font-weight", Column == signalMap ? "bold" : "normal")
        .text(d => d);

}

function MultipleScatters(DivID, data, columns) {
    const container = d3.select('#' + DivID);

    container.selectAll('*').remove();

    const color = d3.scaleOrdinal()
        .domain(columns)
        .range(["#2CA599"]); //, "#1DA2D0", "#EF8C38", "#C74F61"]);

    // Create a div for each column
    const divs = container.selectAll('div')
        .data(columns)
        .enter()
        .append('div')
        .attr('id', d => 'id_temporal' + d.replace(/\s/g, ''))
        .attr('class', 'simpleTemporalChart')
        .each(function (d, i) {
            ScatterIndividual('id_temporal' + d.replace(/\s/g, ''), data.filter(e => e.type == d), d, color(d));
        })
}

function LoadScatter() {
    var selectedSignals = [];
    signalTypes.forEach(signal => {
        if (document.getElementById(signal).checked) {
            selectedSignals.push(signal);
        }
    });
    var changeType = $("#changeType").val();
    var THRESHOLD = $("#threshold").val();
    var url = `/get_scatter_data/${changeType}_${THRESHOLD}`
    for (let i = 0; i < selectedSignals.length; i++) {
        url += `_${selectedSignals[i]}`;
    }
    $.ajax({
        url: url,
        type: 'GET',
        success: function (response) {
            var data = JSON.parse(response);
            MultipleScatters('TemporalMultivariateDiv', data.scatter, data.columns)
        },
        error: function (error) {
            console.log(error);
        }
    });
}