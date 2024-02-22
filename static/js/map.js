var data = null;
mapboxgl.accessToken = 'pk.eyJ1IjoibWF1cm9kaWF6NyIsImEiOiJjbG8yem91N2sxc2NiMm9qeWt2M2JraTBuIn0.YIX7-YY7VR0AsiK97_vRLA';
const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/light-v9',
  center: [-46.63296863559315, -23.550705484971235],
  zoom: 12,
  antialias: true,
  bearing: 0,
  pitch: 0,
  attributionControl: false
});

async function loadFile() {
  try {
    const response = await fetch('/get_map');
    const data = await response.json();

    map.addSource('spatial-data', {
      type: 'geojson',
      data
    });

    const layer = {
      id: 'spatial-data',
      type: 'fill',
      source: 'spatial-data',
      paint: {
        'fill-color': '#ffffff',
        'fill-opacity': 0
      }
    };
    map.addLayer(layer);

    var popup = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false
    });


    // add tooltip with id when hovering over a polygon
    map.on('mousemove', 'spatial-data', (e) => {
      var id = e.features[0].properties.id_poly;
      popup.setLngLat(e.lngLat)
        .setHTML(id)
        .addTo(map);
      //LoadTimeSeries(id);
    });
    map.on("mouseleave", "spatial-data", () => {
      popup.remove();
    });
    map.on("mouseenter", "spatial-data", () => {
      popup.addTo(map);
    });

    // call time series when clicking on a polygon
    map.on('click', 'spatial-data', (e) => {
      var id = e.features[0].properties.id_poly;
      LoadTimeSeries(id);
    });

    updateSpatialFill();

  } catch (error) {
    console.error('Error fetching GeoJSON file:', error);
  }
}

loadFile();

/************************************************** TIME SLIDER *********************** */
var slider_width = document.getElementById("timeslider").clientWidth * 0.99;
$('#timeslider')
  .width(slider_width)
  .offset({ left: 50 - 10, bottom: -20 });

var slider = $("#slider").ionRangeSlider({
  type: 'single',
  skin: 'round',
  min: 1,
  max: 10,
  ticks: true,
  value: 1,
  onChange: function (newRange) {
    updateSpatialFill();
  }
});
/************************************************** TIME SLIDER *********************** */

function updateSpatialFill() {
  var T = $("#slider").data("ionRangeSlider").old_from;
  var type = $("#signalMap").val();
  var value = $("#valueType").val();
  fetch(`/get_spatial_data/${T}_${type}_${value}`)
    .then(data => data.json())
    .then(data => {
      var max = d3.max(data, d => d.value);
      var min = d3.min(data, d => d.value);
      if (max == min) {
        max = max + 1;
      }
      map.getSource('spatial-data').setData({
        type: 'FeatureCollection',
        features: data.map((d, i) => {
          var feature = map.getSource('spatial-data')._data.features[i];
          feature.properties.value = d.value;
          return feature;
        })
      });

      map.setPaintProperty('spatial-data', 'fill-color', ['interpolate', ['linear'], ['get', 'value'], min, '#ffffff', max, '#ff0000']);
      map.setPaintProperty('spatial-data', 'fill-opacity', 0.5);
      map.setPaintProperty('spatial-data', 'fill-outline-color', '#000000');

      var colorScale = d3.scaleLinear()
        .domain([min, max])
        .range(["#ffffff", "#ff0000"]);

      var svg_node = legend({
        color: colorScale,
        title: "Value",
        ticks: 5,
        tickFormat: ".2f",
        width: 200,
      });

      var legendDiv = document.getElementById('mapLegend');
      legendDiv.innerHTML = '';
      legendDiv.appendChild(svg_node);
    })
}

function updateSpatialHighlight(data) {
  // if data is empty, set all opacity to 0.5
  if (data.length == 0) {
    map.setPaintProperty('spatial-data', 'fill-opacity', 0.5);
    return;
  }
  map.getSource('spatial-data').setData({
    type: 'FeatureCollection',
    features: data.map((d, i) => {
      var feature = map.getSource('spatial-data')._data.features[i];
      //feature.properties.value = d.value;
      feature.properties.highlight = d.highlight;
      return feature;
    })
  });

  //update opacity based in highlight boolean
  map.setPaintProperty('spatial-data', 'fill-opacity', ['case', ['get', 'highlight'], 0.5, 0.1]);
}
