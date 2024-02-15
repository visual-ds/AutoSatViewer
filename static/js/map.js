
var map = L.map('map').setView([-15.75, -47.95], 4); // Brazil


L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors',
    maxZoom: 18
}).addTo(map);
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
