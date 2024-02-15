document.addEventListener('DOMContentLoaded', function () {
    // Initialize Leaflet map
    var map = L.map('map').setView([-15.75, -47.95], 4);
    // Add tile layer to the map
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors',
        maxZoom: 18,
    }).addTo(map);
});
