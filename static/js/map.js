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
    const response = await fetch('./static/data/SpCenterCensus10k.geojson');
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

    var type = $("#signalMap").val();
    var signal_data = await fetch(`/get_spatial_data/0_${type}`);
    signal_data = await signal_data.json();
    updateSpatialFill(signal_data);

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
    d = newRange['from'];
    T = d - 1;
    var type = $("#signalMap").val();
    var signal_data = fetch(`/get_spatial_data/${T}_${type}`);
    signal_data.then(data => data.json()).then(data => updateSpatialFill(data));
  }
});
/************************************************** TIME SLIDER *********************** */

function updateSpatialFill(data) {
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
}

function updateSpatialHighlight(data) {
  map.getSource('spatial-data').setData({
    type: 'FeatureCollection',
    features: data.map((d, i) => {
      var feature = map.getSource('spatial-data')._data.features[i];
      feature.properties.value = d.value;
      feature.properties.highlight = d.highlight;
      return feature;
    })
  });
  map.setPaintProperty('spatial-data', 'fill-outline-color', ['case', ['get', 'highlight'], '#000000', '#ffffff']);
}
