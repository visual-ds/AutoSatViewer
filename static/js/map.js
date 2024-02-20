// example function 
function print_id(obj){
  alert(obj);
}

var data = null;
mapboxgl.accessToken = 'pk.eyJ1IjoibWF1cm9kaWF6NyIsImEiOiJjbG8yem91N2sxc2NiMm9qeWt2M2JraTBuIn0.YIX7-YY7VR0AsiK97_vRLA';
async function loadFile() {
  try {
    const response = await fetch('./static/SpCenterCensus10k.geojson');
    const data = await response.json();
    // Create map features after data is loaded

    const map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/light-v9',
      center: [-46.63296863559315,-23.550705484971235],
      zoom: 12,
      antialias: true,
      bearing: 0,
      pitch: 0,
      attributionControl: false
    });
    
    const layer = new deck.GeoJsonLayer({
      id: 'geojson-layer',
      data,
      pickable: true,
      stroked: true,
      filled: true,
      extruded: false,
      pointType: 'circle',
      lineWidthScale: 1,
      getFillColor: [160, 0, 0, 50],
      getLineColor: d => [0, 0, 160, 250],
      getPointRadius: 100,
      getLineWidth: 2
    });

    // overlay for defining hover and callbacks
    const overlay = new deck.MapboxOverlay({
      layers: [
        layer
      ],
      onClick: ({object}) => Test_Ajax(object.properties.id_poly),//print_id(object.properties.id_poly),
      getTooltip: ({object}) => object && {
      html: `<h2>${object.properties.id_poly}</h2><p>id poly</p>`,
      style: {
        backgroundColor: '#e6fffa',
      }}
    });
    map.addControl(overlay);

  } catch (error) {
    console.error('Error fetching GeoJSON file:', error);
  }
}

loadFile();

/************************************************** TIME SLIDER *********************** */
var slider_width = document.getElementById("timeslider").clientWidth * 0.99;
$('#timeslider')
.width(slider_width)
.offset({left: 50 - 10, bottom:-20});

var slider = $("#slider").ionRangeSlider({
type: 'single',
skin: 'round',
min: 1,
max: 10,
ticks:true,
value:1,
onChange: function(newRange){
  d = newRange['from'];
  T = d - 1;
  console.log(T);
  //tiles.redraw();
  //tiles1.redraw();
  //tiles2.redraw();
}
});
/************************************************** TIME SLIDER *********************** */
