var T = 0;

// var cdblight = L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png', {
//             attribution: 'Colaboradores: <a href="http://visualdslab.com/">Visual Data Science lab</a> & <a href="https://portal.fgv.br/">FGV</a> |', //+' &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
//             subdomains: 'abcd',
//             minZoom: 9,
//             maxZoom: 12,
//             //maxNativeZoom: 28,
            
// });

// var planet = L.tileLayer('http://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',{ //'https://tileserver-mapbiomas.sccon.com.br/mapbiomas/tiles/1.0.0/planet_mosaic_2021_07/planet/{z}/{x}/{y}.png'
//             attribution: "",
//             subdomains: 'abcd',
//             minZoom: 9,
//             maxZoom: 12,
//             //maxNativeZoom: 28, 
// });


// var cdblight2 = L.tileLayer('http://0.gusc.cartocdn.com/cemdevops/api/v1/map/7dc8c60e6ce81b15ab93873c65b74c8e:1527080869781/0/{z}/{x}/{y}.png', {
//             attribution: 'Colaboradores: <a href="http://visualdslab.com/">Visual Data Science lab</a> & <a href="https://portal.fgv.br/">FGV</a> |', //+' &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
//             subdomains: 'abcd',
//             minZoom: 9,
//             maxZoom: 12,
//            // maxNativeZoom: 28,
            
// });


const map = L.map('map').setView([-1, -50], 12);
var tiles = L.tileLayer("http://127.0.0.1:5000/tiles/{z}/{x}/{y}/{time}.png", {
    minZoom: 9,
    maxZoom: 12,
    attribution: 'Colaboradores: <a href="http://visualdslab.com/">Visual Data Science lab</a> & <a href="https://portal.fgv.br/">FGV</a> |',
    time: () => T,
}).addTo(map);

/*

var topographyAndPlaces = L.tileLayer.wms('https://production.alerta.mapbiomas.org/geoserver/ows', {
    layers: "mapbiomas-alertas:dashboard_states-static-layer",
}).addTo(map);*/


//var baseMaps ={
//  "Carto BD": cdblight,
//  "Planet": planet
//}


var overlayMaps = {
  "Estados": L.tileLayer.wms('https://production.alerta.mapbiomas.org/geoserver/ows', {layers: "mapbiomas-alertas:dashboard_states-static-layer", transparent: true, format: "image/png", minZoom: 9, maxZoom: 12}),
  "Municipios": L.tileLayer.wms('https://production.alerta.mapbiomas.org/geoserver/ows', {layers: "mapbiomas-alertas:dashboard_cities-static-layer", transparent: true, format: "image/png", minZoom: 9, maxZoom: 12}),
  "Biomes": L.tileLayer.wms('https://production.alerta.mapbiomas.org/geoserver/ows', {layers: "mapbiomas-alertas:dashboard_biomes-static-layer", transparent: true, format: "image/png", minZoom: 9, maxZoom: 12}),
  "Amazonia Legal": L.tileLayer.wms('https://production.alerta.mapbiomas.org/geoserver/ows', {layers: "mapbiomas-alertas:dashboard_amazonia-legal-static-layer", transparent: true, format: "image/png", minZoom: 9, maxZoom: 12}),
  "conservation_units": L.tileLayer.wms('https://production.alerta.mapbiomas.org/geoserver/ows', {layers: "mapbiomas-alertas:dashboard_conservation-unit-static-layer", transparent: true, format: "image/png", minZoom: 9, maxZoom: 12}),
};


// Initialise the FeatureGroup to store editable layers
var drawnItems = new L.FeatureGroup();
map.addLayer(drawnItems);

var scale = L.control.scale({position:'topleft'}); // Creating scale control
scale.addTo(map); // Adding scale control to the map


//var bounds = new L.LatLngBounds({ lat: -23.1, lng: -46.5 }, { lat: -23.387136, lng: -46.410709 });
//map.setMaxBounds(bounds);
// Adding some controls
L.drawLocal.draw.toolbar.buttons.polygon = 'Desenhar região!';
L.drawLocal.draw.toolbar.buttons.marker  = 'Marcar um ponto!';

//L.control.zoom({ position: 'bottomright'}).addTo(map);
var drawPluginOptions = {
    position: 'topleft',
    draw: {
      polyline: true,//true,
      marker: true,
      circle: true,
      rectangle: false,
      circlemarker: true,
      polygon: {
          allowIntersection: false, // Restricts shapes to simple polygons
          drawError: {
            color: '#e1e100', // Color the shape will turn when intersects
        },
          shapeOptions: {
            color: '#bada55'
          }
      },
      editable: false,
      },
  };
  
  // Initialise the draw control and pass it the FeatureGroup of editable layers
  var drawControl = new L.Control.Draw(drawPluginOptions);
  map.addControl(drawControl);


  function positionTooltip(x, y) {
    tooltip.style("top", y + 10 + "px")
      .style("left", x + 10 + "px");
  }


//----------------------------------------- SLIDER
var slider_height = document.getElementById("timeslider").clientHeight;
var timesteps = 20;

var sliderTime = d3
    .sliderLeft()
    .min(0)
    .max(timesteps)
    .step(1)
    .height(slider_height-80)
    .displayValue(false)
    .default(0) 
    .handle(d3.symbol().type(d3.symbolCircle).size(200)())
    .on('onchange', (d) => {
      T = d;
      tiles.redraw();
      d3.select('p#value-time').text(d);

      /*
     tooltip.transition()
                    .duration(200)
                    .style("opacity", .9);
                tooltip.html("Soy un círculo rojo")
                    .style("left",d3.pointer(d3.event,this)[0] + "px")
                    .style("top", ( 28) + "px"); */
        })
    .on("end", function (d) {
          //tooltip.transition()
          //    .duration(500)
          //    .style("opacity", 0);
      });
   
/*
    var x = d3.scaleLinear()
    .domain(d3.extent([1,2,3,4,5,6,7,8]))
    .range([0, slider_width])
    .clamp(true);*/

  var gTime = d3.select('div#timeslider')
    .append('svg')
    .attr('height', slider_height)
    .attr('width', 45)
    .append('g')
    .attr('transform', 'translate(15, 65)');


  gTime.call(sliderTime);




  var layerControl = L.control.layers(
    null, 
    overlayMaps,
    {position: 'topleft'}
  ).addTo(map);







  