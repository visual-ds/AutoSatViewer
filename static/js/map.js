var cdblight = L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png', {
            attribution: 'Colaboradores: <a href="http://visualdslab.com/">Visual Data Science lab</a> & <a href="https://portal.fgv.br/">FGV</a> |', //+' &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
            subdomains: 'abcd',
            minZoom: 0,
            maxZoom: 19,
            //maxNativeZoom: 28,
            
});

var planet = L.tileLayer('http://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',{ //'https://tileserver-mapbiomas.sccon.com.br/mapbiomas/tiles/1.0.0/planet_mosaic_2021_07/planet/{z}/{x}/{y}.png'
            attribution: "",
            subdomains: 'abcd',
            minZoom: 0,
            //maxZoom: 19,
            //maxNativeZoom: 28, 
});


var cdblight2 = L.tileLayer('http://0.gusc.cartocdn.com/cemdevops/api/v1/map/7dc8c60e6ce81b15ab93873c65b74c8e:1527080869781/0/{z}/{x}/{y}.png', {
            attribution: 'Colaboradores: <a href="http://visualdslab.com/">Visual Data Science lab</a> & <a href="https://portal.fgv.br/">FGV</a> |', //+' &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
            subdomains: 'abcd',
            minZoom: 0,
           // maxZoom: 19,
           // maxNativeZoom: 28,
            
});


/*
const map = new L.Map('map', {
 // renderer: L.canvas(),
	layers: [cdblight], //[Hydda_Full],//[CartoDB_Positron],
    center: new L.LatLng(-23.6, -46.55), //centro do Sao Paulo {lat: -23.6, lng: -46.55} (-23.548682, -46.634731)
	zoom: 6,
  minZoom:0,
  maxZoom:40,
	worldCopyJump: false,
	zoomControl: false,
	pitch: 80
});*/

const map = L.map('map').setView([-1, -50], 12);
L.tileLayer("http://127.0.0.1:5000/tiles/{z}/{x}/{y}.png", {
//L.tileLayer("http://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    minZoom: 9,
    maxZoom: 12,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

/*

var topographyAndPlaces = L.tileLayer.wms('https://production.alerta.mapbiomas.org/geoserver/ows', {
    layers: "mapbiomas-alertas:dashboard_states-static-layer",
}).addTo(map);*/


var baseMaps ={
  "Carto BD": cdblight,
  "Planet": planet
}




var overlayMaps = {
  "Sao Paulo": cdblight2,
  "Estados": L.tileLayer.wms('https://production.alerta.mapbiomas.org/geoserver/ows', {layers: "mapbiomas-alertas:dashboard_states-static-layer", transparent: true, format: "image/png",}),
  "Municipios": L.tileLayer.wms('https://production.alerta.mapbiomas.org/geoserver/ows', {layers: "mapbiomas-alertas:dashboard_cities-static-layer", transparent: true, format: "image/png",}),
  "Biomes": L.tileLayer.wms('https://production.alerta.mapbiomas.org/geoserver/ows', {layers: "mapbiomas-alertas:dashboard_biomes-static-layer", transparent: true, format: "image/png",}),
  "Amazonia Legal": L.tileLayer.wms('https://production.alerta.mapbiomas.org/geoserver/ows', {layers: "mapbiomas-alertas:dashboard_amazonia-legal-static-layer", transparent: true, format: "image/png",}),
  "conservation_units": L.tileLayer.wms('https://production.alerta.mapbiomas.org/geoserver/ows', {layers: "mapbiomas-alertas:dashboard_conservation-unit-static-layer", transparent: true, format: "image/png",}),

};


// Initialise the FeatureGroup to store editable layers
var drawnItems = new L.FeatureGroup();
map.addLayer(drawnItems);

var scale = L.control.scale({position:'topleft'}); // Creating scale control
scale.addTo(map); // Adding scale control to the map


/*===================================================== ============================================= */
/*===================================================== ============================================= */
/*arraySAOPAULO =[]
SP_latsAlgs.forEach(function(d){
  arraySAOPAULO.push([d.lat,d.lng]);
});
L.polyline(arraySAOPAULO, {
        id:'sp_markerwater',
        color: 'red',
        weight: 1,
        opacity: 0.5,
        dashArray: '5,5'
}).addTo(map);*/
/*===================================================== ============================================= */
/*===================================================== ============================================= */

//var bounds = new L.LatLngBounds({ lat: -23.1, lng: -46.5 }, { lat: -23.387136, lng: -46.410709 });
//map.setMaxBounds(bounds);
// Adding some controls
L.drawLocal.draw.toolbar.buttons.polygon = 'Desenhar região!';
L.drawLocal.draw.toolbar.buttons.marker  = 'Marcar um ponto!';

L.control.zoom({ position: 'bottomright'}).addTo(map);
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
    //edit: {
    //    featureGroup: drawnItems, //REQUIRED!!
     //   remove: false,
       // buffer: {replacePolylines: false,
        //separateBuffer: false}
    //}
  };
  
  // Initialise the draw control and pass it the FeatureGroup of editable layers
  var drawControl = new L.Control.Draw(drawPluginOptions);
  map.addControl(drawControl);



//----------------------------------------- SLIDER
//Getting slider width
var slider_width = document.getElementById("timeslider").clientWidth;
var dataTime = d3.range(0, 10).map(function(d) {
    return new Date(1995 + d, 10, 3);
  });

var sliderTime = d3
    .sliderBottom()
    .min(d3.min(dataTime))
    .max(d3.max(dataTime))
    .step(1000 * 60 * 60 * 24 * 365)
    .width(slider_width-80)
    .displayValue(false)
    .tickFormat(d3.timeFormat('%Y'))
    .tickValues(dataTime)
    .default(new Date(1998, 10, 3))
    .handle(d3.symbol().type(d3.symbolCircle).size(200)())
    .on('onchange', val => {
      //d3.select('p#value-time').text(d3.timeFormat('%Y')(val));
    });

  var gTime = d3
    .select('div#timeslider')
    .append('svg')
    .attr('width', slider_width)
    .attr('height', 100)
    .append('g')
    .attr('transform', 'translate(30,50)');

  gTime.call(sliderTime);

  d3.select('p#value-time').text(d3.timeFormat('%Y')(sliderTime.value()));


  var layerControl = L.control.layers(baseMaps, overlayMaps,{position: 'topleft'}).addTo(map);