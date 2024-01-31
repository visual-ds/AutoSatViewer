var T = 0;
var center_lat = -1;
var center_lon = -50;

const map = L.map('map').setView([-1, -50], 12);
const map1 = L.map('mapa-left').setView([-1, -50], 12);
const map2 = L.map('mapa-right').setView([-1, -50], 12);

var tiles = L.tileLayer("http://127.0.0.1:5000/tiles/{z}/{x}/{y}/{time}.png", {
    minZoom: 9,
    maxZoom: 12,
    attribution: 'Colaboradores: <a href="http://visualdslab.com/">Visual Data Science lab</a> & <a href="https://portal.fgv.br/">FGV</a> |',
    time: () => T,
}).addTo(map);

var tiles1 = L.tileLayer("http://127.0.0.1:5000/tiles/{z}/{x}/{y}/{time}.png", {
  minZoom: 9,
  maxZoom: 12,
  time: () => Math.max(T - 1, 0),
}).addTo(map1);

var tiles2 = L.tileLayer("http://127.0.0.1:5000/tiles/{z}/{x}/{y}/{time}.png", {
  minZoom: 9,
  maxZoom: 12,
  time: () => Math.min(T + 1, 19),
}).addTo(map2);


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


// Adding some controls
L.drawLocal.draw.toolbar.buttons.polygon = 'Desenhar região!';
L.drawLocal.draw.toolbar.buttons.marker  = 'Marcar um ponto!';

var drawPluginOptions = {
    position: 'topleft',
    draw: {
      polyline: true,//true,
      marker: true,
      circle: true,
      rectangle: false,
      circlemarker: true,
      polygon: {
          allowIntersection: false,
          drawError: {
            color: '#e1e100',
        },
          shapeOptions: {
            color: '#bada55'
          }
      },
      editable: false,
      },
  };
  
  var drawControl = new L.Control.Draw(drawPluginOptions);
  map.addControl(drawControl);


  function positionTooltip(x, y) {
    tooltip.style("top", y + 10 + "px")
      .style("left", x + 10 + "px");
  }


//----------------------------------------- SLIDER
var slider_width = document.getElementById("timeslider").clientWidth * 0.95;
var timesteps = 20;

var sliderTime = d3
    .sliderBottom()
    .min(1)
    .max(timesteps)
    .step(1)
    .width(slider_width)
    .displayValue(false)
    .default(1) 
    .handle(d3.symbol().type(d3.symbolCircle).size(200)())
    .on('onchange', (d) => {
      T = d - 1;
      tiles.redraw();
      tiles1.redraw();
      tiles2.redraw();
      d3.select('p#value-time').text(d);
    });
   
var gTime = d3.select('div#timeslider')
  .append('svg')
  .attr('height', 40)
  .attr('width', slider_width)
  .append('g')
  .attr('transform', 'translate(10, 20)');

gTime.call(sliderTime);


var layerControl = L.control.layers(
  null, 
  overlayMaps,
  {position: 'topleft'}
).addTo(map);

/*
map.sync(map1);
map.sync(map2);
map1.sync(map2);
map1.sync(map);
map2.sync(map1);
map2.sync(map);*/
// Función para sincronizar los mapas
function syncMaps(mainMap, maps) {
  mainMap.on('move', () => {
      maps.forEach(map => map.setView(mainMap.getCenter(), mainMap.getZoom()));
  });
}

// Sincronizar los mapas entre sí
syncMaps(map, [map1, map2]);
syncMaps(map1, [map, map2]);
syncMaps(map2, [map, map1]);

// Inicializar Split.js para ajuste de ancho de paneles
Split(['#mapa-left', '#map', '#mapa-right'], {
  direction: 'horizontal',
  gutterSize: 8,
  cursor: 'col-resize',
  onDragEnd: () => [map,map1, map2].forEach(map => map.invalidateSize()), // Ajustar el tamaño del mapa después del cambio de ancho
});

map.on("moveend", function(e) {
  center_lat = map.getCenter().lat;
  center_lon = map.getCenter().lng;
});



  