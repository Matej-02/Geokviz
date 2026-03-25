let map = L.map('map').setView([54, 15], 4);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: ''
}).addTo(map);

let features = [];
let currentFeature = null;
let roundCount = 0;
let totalDistance = 0;
let bestScore = localStorage.getItem("bestScore");

if (bestScore !== null) {
  document.getElementById("best").textContent = bestScore;
}

fetch("locations.geojson")
  .then(res => res.json())
  .then(data => {
    features = data.features;
    startRound();
  });

function startRound() {
  if (roundCount === 10) {
    endGame();
    return;
  }

  currentFeature = features[Math.floor(Math.random() * features.length)];
  alert("Najdi: " + currentFeature.properties.name);

  map.once("click", onMapClick);
}

function onMapClick(e) {
  let userPoint = turf.point([e.latlng.lng, e.latlng.lat]);
  let polygon = currentFeature.geometry;

  let distKm = turf.pointToPolygonDistance(userPoint, polygon, {
    units: "kilometers"
  });

  let km = Math.round(distKm);
  totalDistance += km;
  roundCount++;

  document.getElementById("count").textContent = roundCount;
  document.getElementById("total").textContent = totalDistance;

  let layer = L.geoJSON(currentFeature, {
    style: { color: "red", weight: 2 }
  }).addTo(map);

  let center = turf.center(currentFeature).geometry.coordinates;

  L.popup()
    .setLatLng([center[1], center[0]])
    .setContent(
      "<b>" + currentFeature.properties.name + "</b><br>" +
      "Zgrešil si: <b>" + km + " km</b><br><br>" +
      currentFeature.properties.info
    )
    .openOn(map);

  setTimeout(() => {
    map.removeLayer(layer);
    startRound();
  }, 2000);
}

function endGame() {
  alert("KONEC IGRE!\nSkupna razdalja: " + totalDistance + " km");

  if (bestScore === null || totalDistance < bestScore) {
    localStorage.setItem("bestScore", totalDistance);
    document.getElementById("best").textContent = totalDistance;
    alert("NOVO OSEBNI REKORD!");
  }

  if (confirm("Igraj znova?")) {
    roundCount = 0;
    totalDistance = 0;
    document.getElementById("count").textContent = 0;
    document.getElementById("total").textContent = 0;
    startRound();
  }
}
