var data = null;
mapboxgl.accessToken = 'pk.eyJ1IjoibWF1cm9kaWF6NyIsImEiOiJjbG8yem91N2sxc2NiMm9qeWt2M2JraTBuIn0.YIX7-YY7VR0AsiK97_vRLA';
const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/maurodiaz7/clt7o0y8u02rm01p69a64boce',
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
        'fill-opacity': 0.75
      }
    };
    map.addLayer(layer);

    var clicked = undefined;

    var popup = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false
    });


    // add tooltip with id when hovering over a polygon
    map.on('mousemove', 'spatial-data', (e) => {
      var id = e.features[0].properties.id_poly;
      var value = e.features[0].properties.value;
      popup.setLngLat(e.lngLat)
        .setHTML(`ID: ${id}<br>Value: ${value.toFixed(2)}`)
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
      console.log($("#bottomPanel").val())
      if (clicked == id) {
        clicked = undefined;
        if ($("#bottomPanel").val() == "timeseries") {
          LoadTimeSeries();
        }
      } else {
        clicked = id;
        if ($("#bottomPanel").val() == "timeseries") {
          LoadTimeSeries(id);
        }
      }
    });

    updateSpatialFill();
    console.log($("#bottomPanel").val())
    if ($("#bottomPanel").val() == "timeseries") {
      LoadTimeSeries();
    } else if ($("#bottomPanel").val() == "scatter") {
      LoadScatter();
    }

  } catch (error) {
    console.error('Error fetching GeoJSON file:', error);
  }
}

loadFile();

/************************************************** TIME SLIDER *********************** */
var slider_width = document.getElementById("timeslider").clientWidth * 0.99;
$('#timeslider')
  .width(slider_width);

function setSlider(data) {
  var date = data.map(d => new Date(d.date).toDateString());
  date = date.filter((v, i, a) => a.indexOf(v) === i);
  var nDates = date.length;

  var slider = $("#slider").ionRangeSlider({
    type: 'single',
    skin: 'round',
    min: 1,
    max: nDates,
    ticks: true,
    value: 1,
    onChange: function (newRange) {
      // triger click on TimeIndicator
      d3.selectAll(".TimeIndicator").dispatch("click");
      updateSpatialFill();
    }
  });
}


/************************************************** TIME SLIDER *********************** */

function updateSpatialFill() {
  // check if slider is defined
  var T;
  if ($("#slider").data("ionRangeSlider") == undefined) {
    T = 0;
  } else {
    T = $("#slider").data("ionRangeSlider").old_from - 1;
  }
  var type = $("#signalMap").val();
  var value = $("#valueType").val();
  fetch(`/get_spatial_data/${T}_${type}_${value}`)
    .then(data => data.json())
    .then(response => {
      var data = response.data;
      var quantiles = response.quantiles;
      var colors = ["#ffffff", '#efedf5', '#dadaeb', '#bcbddc', '#9e9ac8', '#807dba', '#6a51a3', '#54278f', '#3f007d']

      var colorScale = d3.scaleThreshold()
        .domain(quantiles)
        .range(colors);


      map.getSource('spatial-data').setData({
        type: 'FeatureCollection',
        features: data.map((d, i) => {
          var feature = map.getSource('spatial-data')._data.features[i];
          feature.properties.value = d.value;
          return feature;
        })
      });

      map.setPaintProperty('spatial-data', 'fill-color', ['step', ['get', 'value'], colors[0], quantiles[0], colors[1], quantiles[1], colors[2], quantiles[2], colors[3], quantiles[3], colors[4], quantiles[4], colors[5], quantiles[5], colors[6], quantiles[6], colors[7], quantiles[7], colors[8]]);



      var svg_node = legend({
        color: colorScale,
        title: type + " " + value,
        ticks: 5,
        tickFormat: quantiles[7] <= 1 ? ".2f" : "d",
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
    map.setPaintProperty('spatial-data', 'fill-opacity', 0.75);
    map.setPaintProperty('spatial-data', 'fill-outline-color', '#cccccc');
    return;
  }
  map.getSource('spatial-data').setData({
    type: 'FeatureCollection',
    features: data.map((d, i) => {
      var feature = map.getSource('spatial-data')._data.features[i];
      feature.properties.highlight = d.highlight;
      return feature;
    })
  });

  //update opacity based in highlight boolean
  map.setPaintProperty('spatial-data', 'fill-opacity', ['case', ['get', 'highlight'], 1, 0.25]);

  //update stroke color based in highlight boolean
  map.setPaintProperty('spatial-data', 'fill-outline-color', ['case', ['get', 'highlight'], '#C70039', '#cccccc']);
}
