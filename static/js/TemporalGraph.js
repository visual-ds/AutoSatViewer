function draw_Temporal_Graph(data,timeSteps,rows){
    const grid_Band_Width = 30;
    const grid_height = 30;

    const margin = { top: 50, right: 20, bottom: 20, left: 30 },
        width = (timeSteps.length*grid_Band_Width) + margin.left + margin.right,
        height = (rows.length*grid_height) + margin.top + margin.bottom;

    const svg = d3.select("#temporalChartLine")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);


    const xScale = d3.scaleBand().domain(timeSteps).range([0, width]).padding(0.1);
    const yScale = d3.scaleBand().domain(rows).range([0, height]).padding(0.1);

    // disenhar o grid
    for (let i = 0; i <= timeSteps.length; i++) {
        svg.append('g')
            .attr('class', 'grid')
            .attr('transform', `translate(${xScale(i)},0)`)
            .call(d3.axisLeft(yScale).tickSize(-width).tickFormat(''));
    }

    for (let i = 0; i <= rows.length; i++) {
    svg.append('g')
        .attr('class', 'grid')
        .attr('transform', `translate(0,${yScale(data[i].row)})`)
        .call(d3.axisTop(xScale).tickSize(-height).tickFormat(''));
    }

    data.forEach(d => {
    svg.append("circle")
        .attr("class", "node")
        .attr("cx", xScale(d.timeStep) + xScale.bandwidth() / 2)
        .attr("cy", yScale(d.row) + yScale.bandwidth() / 2)
        .attr("r", d.node_value) 
        .style("fill", "#8dd3c7")
        .style("stroke","#56beac")
    });

    svg.append("g")
        .attr("transform", `translate(0,${-margin.top / 2})`)
        .call(d3.axisTop(xScale).tickFormat(i => `${i+1}`));

    svg.append("g")
        .call(d3.axisLeft(yScale));
}



d3.json("https://raw.githubusercontent.com/germaingarcia/diplomadoFiles/main/Temporal_Example.json").then(function(GraphData) {
    draw_Temporal_Graph(GraphData.data,GraphData.timeSteps,GraphData.rows);
})