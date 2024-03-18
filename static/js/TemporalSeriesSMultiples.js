function MultivariateTimeSeries_Individual(DivID, data, dataNeighbors, Column, color) {
    const miDiv = document.getElementById(DivID);
    var signalMap = $("#signalMap").val();

    const viz_width = miDiv.offsetWidth,
        viz_height = miDiv.offsetHeight;

    const margin = { top: 20, right: 10, bottom: 50, left: 25 },
        width = viz_width - margin.left - margin.right,
        height = viz_height - margin.top - margin.bottom;

    data.forEach(d => { d.date = new Date(d.date) });
    dataNeighbors.forEach(d => { d.date = new Date(d.date) });
    var datesArray = data.map(d => d.date);
    datesArray = datesArray.filter((date, i, self) =>
        self.findIndex(d => d.getTime() === date.getTime()) === i
    );
    // select 4 equaly spaced dates
    var nDates = datesArray.length;
    var step = Math.floor(nDates / 4);
    var ticks = [datesArray[0], datesArray[step], datesArray[2 * step], datesArray[3 * step]];
    // verify if min date and max date are in the same year
    var sameYear = datesArray[0].getFullYear() == datesArray[nDates - 1].getFullYear();

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
    //.curve(d3.curveNatural);
    svg.append("g")
        .attr("class", "x-axis")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x)
            .tickFormat(d3.timeFormat(sameYear ? "%m/%d" : "%y/%m/%d"))
            .tickValues(ticks)
        )
        .selectAll("text")
        .style("text-anchor", "end")
        .style("font-size", "9.5px")
        .style("font-weight", "bold")
        .attr("transform", "rotate(-45)")
    // .selectAll("g")
    // .append("line")
    // .style('stroke', '#E3E9ED')
    // .attr("y2", -height);

    svg.append("g")
        .attr("class", "y-axis")
        .call(d3.axisLeft(y).ticks(6))
    // .selectAll("g")
    // .append("line")
    // .style('stroke', '#E3E9ED')
    // .attr("x2", width);

    // Draw vertical line at slider position
    var slideridx;
    if ($("#slider").data("ionRangeSlider")) {
        slideridx = $("#slider").data("ionRangeSlider").old_from - 1;
    } else {
        slideridx = 0;
    }
    var sliderDate = datesArray[slideridx];
    svg.append("line")
        .attr("x1", x(sliderDate))
        .attr("y1", 0)
        .attr("x2", x(sliderDate))
        .attr("y2", height)
        .attr("class", "TimeIndicator")
        .style("stroke", "#C41E3A")
        .style("stroke-width", 2)
        .style("opacity", 0.5)
        .on("click", function (event, d) {
            var slideridx = $("#slider").data("ionRangeSlider").old_from - 1;
            var sliderDate = datesArray[slideridx];
            d3.select(this).attr("x1", x(sliderDate)).attr("x2", x(sliderDate));
        });

    svg.append("path")
        .data([dataNeighbors])
        .attr("class", "line")
        .style("stroke", "#cccccc")
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
        .attr("x", 0)
        .attr("y", -10)
        .attr("dy", ".35em")
        .style("text-anchor", "start")
        .style("font-weight", Column == signalMap ? "bold" : "normal")
        .text(d => d);

    // add border
    svg.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("height", height)
        .attr("width", width)
        .style("stroke", "gray")
        .style("fill", "transparent")
        .style("stroke-width", 1);
}

function MultivariateTimeSeriesSmallMultiples(DivID, data, dataNeighbors, columns) {
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
            MultivariateTimeSeries_Individual('id_temporal' + d.replace(/\s/g, ''), data, dataNeighbors, d, color(d));
        })
}

function LoadTimeSeries(id) {
    $.ajax({
        url: '/get_time_series',
        data: JSON.stringify({ 'block_id': id }),
        type: 'POST',
        contentType: "application/json",
        dataType: 'JSON',
        success: function (response) {
            var data = response;
            MultivariateTimeSeriesSmallMultiples('TemporalMultivariateDiv', data.temporal, data.neighbors, data.columns)
        },
        error: function (error) {
            console.log(error);
        }
    });
}