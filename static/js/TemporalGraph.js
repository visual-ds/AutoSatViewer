function draw_Temporal_Graph(data,timeSteps,rows){
    const total_height_right = (window.innerHeight - 100) * 0.9;
    const total_width_right = 250;
    //const grid_Band_Width = 30;
    //const grid_height = 30;

    const margin = { top: 50, right: 20, bottom: 20, left: 30 },
        width = total_width_right - margin.left - margin.right,
        height = total_height_right - margin.top - margin.bottom;

    const svg = d3.select("#temporalChartLine")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);


    const xScale = d3.scaleBand().domain(timeSteps).range([0, width]).padding(0.1);
    const yScale = d3.scaleBand().domain(rows).range([0, height]).padding(0.1);
    var myColor = d3.scaleLinear()
        .range(["white", "#ee0000"])
        .domain(d3.extent(data, d => Math.abs(d.node_value)));

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
        .attr("r", xScale.bandwidth() / 2)
        //.style("fill", "#8dd3c7")
        .style("fill", myColor(d.node_value))
        //.style("stroke","#56beac")
        .on("click", function (event) {
            var lon = (d.lon_min + d.lon_max)/2;
            var lat = (d.lat_min + d.lat_max)/2;
            map.setView(new L.LatLng(lat, lon), 12);
            map.removeLayer(cursos_layer);
            cursos_layer = L.rectangle([[d.lat_min, d.lon_min], [d.lat_max, d.lon_max]], {color: "#ff7800", weight: 4, fill : false})
            map.addLayer(cursos_layer);
            sliderTime.value(d.t);
        })
    });

    svg.append("g")
        .attr("transform", `translate(0,${-margin.top / 2})`)
        .call(d3.axisTop(xScale).tickFormat(i => `${i+1}`).tickValues([0, 5, 10, 15]));

    svg.append("g")
        .call(d3.axisLeft(yScale)
        // remove ticks lines
        .tickSize(0)
        .tickFormat(""))
}


fetch("http://127.0.0.1:5000/temporal_graph")
    .then(response => response.json())
    .then(response => {
        console.log(response)
        draw_Temporal_Graph(response.data,response.timeSteps,response.rows);
    });

// d3.json("https://raw.githubusercontent.com/germaingarcia/diplomadoFiles/main/Temporal_Example.json").then(function(GraphData) {
//     draw_Temporal_Graph(GraphData.data,GraphData.timeSteps,GraphData.rows);
// })