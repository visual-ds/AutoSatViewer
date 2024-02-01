function draw_Temporal_Graph(data){
    const total_height_right = (window.innerHeight - 180) ;//* 0.9;
    const total_width_right = 450;

    const margin = { top: 50, right: 20, bottom: 20, left: 30 },
    width = total_width_right - margin.left - margin.right,
    height = total_height_right - margin.top - margin.bottom;

    var svg = d3.select("#temporalChartLine")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);
    //width = +svg.attr("width"),
    //height = +svg.attr("height");



    // Escalas para posicionar los nodos
    /*var xScale = d3.scaleLinear()
        .domain([0, d3.max(data.timeSteps)])
        .range([50, width - 100]);

    // Escala para Y ajustada para reducir el espacio vertical
    var yScale = d3.scaleBand() // Usar scaleBand para controlar mejor el espacio entre filas
        .domain(data.rows)
        .range([50, height - 50])
        .paddingInner(0.1); // Ajusta este valor para controlar el espacio entre filas
    */
    const xScale = d3.scaleBand().domain(data.timeSteps).range([0, width]).padding(0.1);
    const yScale = d3.scaleBand().domain(data.rows).range([0, height]).padding(0.1);
    const grid_size =7;
    var myColor = d3.scaleLinear()
        .range(["white", "#009999"])
        .domain(d3.extent(data.data, d => Math.abs(d.node_value)));

        var nodePositions = {};
        data.data.forEach(d => {
            nodePositions[d.node_id] = {
                x: xScale(d.timeStep)+grid_size/2 , // Ajustar según el nuevo ancho
                y: yScale(d.row)+grid_size/2// Centrar en la altura de la banda
            };
        });
        
    // Crear aristas con estilo mejorado
    link =svg.selectAll(".link")
        .data(data.adj_list)
        .enter().append("line")
        .attr("class", "link")
        .attr("x1", d => nodePositions[d.source].x)
        .attr("y1", d => nodePositions[d.source].y)
        .attr("x2", d => nodePositions[d.target].x)
        .attr("y2", d => nodePositions[d.target].y)
        //.style("stroke", "#aaa") // Color más suave para las aristas
        .style("stroke-width", 2); // Aristas más gruesasx

    // Crear nodos con estilo mejorado
    svg.selectAll(".node")
        .data(data.data)
        .enter().append("rect")
        .attr("class", "node")
        .attr("x", d => xScale(d.timeStep) )
        .attr("y", d => yScale(d.row) )
        .attr("width", grid_size) // Ancho más estrecho
        .attr("height", grid_size) // Altura basada en la escala de banda
        .attr("rx", 2)
        .style("fill", d=> myColor(d.node_value))
        .attr("stroke", "black") // Bordes para los nodos
        .attr("stroke-width", 1)
        .on("mouseover", function(event, d) {
            link.classed("highlighted", function(l) {
                return l.source === d.node_id || l.target === d.node_id;
            });
        }).on("mouseout", function() {
            link.classed("highlighted", false);
        });
       /* .on('mouseover',function(){
            d3.selectAll('.node')
            .style('fill-opacity', 0.3)
            d3.select(this)
            .style('fill-opacity', 1)
        })
        .on('mouseout', function(d) {
                d3.selectAll('.node')
            .style('fill-opacity', 1)
        })*/

    
        svg.append("g")
        .attr("transform", `translate(0,${-margin.top / 2})`)
        .call(d3.axisTop(xScale).tickFormat(i => `${i+1}`).tickValues([0, 5, 10, 15]));

    svg.append("g")
        .call(d3.axisLeft(yScale)
        // remove ticks lines
        .tickSize(0)
        .tickFormat(""))
    
        

}   
/*
fetch("http://127.0.0.1:5000/temporal_graph")
    .then(response => response.json())
    .then(response => {
        console.log(response)
        draw_Temporal_Graph(response);
    });

*/
d3.json("https://raw.githubusercontent.com/germaingarcia/diplomadoFiles/main/data_temporal_graph_light.json").then(function(GraphData) {

    draw_Temporal_Graph(GraphData);
 })     