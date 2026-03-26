let map = L.map('map', {
  tap: true
}).setView([54, 15], 4);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: ''
}).addTo(map);

let features = [];
let currentFeature = null;
let roundCount = 0;
let totalDistance = 0;
let clickEnabled = true;

// BEST SCORE
let bestScore = localStorage.getItem("bestScore");
if (bestScore !== null) {
  bestScore = Number(bestScore);
  document.getElementById("best").textContent = bestScore;
}

// LOAD GEOJSON
fetch("locations.geojson")
  .then(res => res.json())
  .then(data => {
    console.log("GeoJSON loaded");
    features = data.features;
    startRound();
  })
  .catch(err => {
    console.error("NAPAKA GEOJSON:", err);
    alert("Ne morem naložiti locations.geojson");
  });

function startRound() {
  if (roundCount === 10) {
    endGame();
    return;
  }

  clickEnabled = true;

  currentFeature = features[Math.floor(Math.random() * features.length)];

  alert("Najdi: " + currentFeature.properties.name);

  // ENOTEN EVENT (desktop + mobile)
  map.once("pointerup", handleMapInteraction);
}

function handleMapInteraction(e) {
  if (!clickEnabled) return;
  clickEnabled = false;

  if (!e.latlng) {
    console.log("Ni latlng!");
    return;
  }

  onMapClick(e.latlng);
}

function onMapClick(latlng) {

  let userPoint = turf.point([latlng.lng, latlng.lat]);

  // ROB POLIGONA
  let boundary = turf.polygonToLine(currentFeature);

  let nearest = turf.nearestPointOnLine(boundary, userPoint, {
    units: "kilometers"
  });

  let distKm = nearest.properties.dist;
  let km = Math.round(distKm);

  totalDistance += km;
  roundCount++;

  document.getElementById("count").textContent = roundCount;
  document.getElementById("total").textContent = totalDistance;

  // PRIKAŽI POLIGON
  let layer = L.geoJSON(currentFeature, {
    style: { color: "red", weight: 2 }
  }).addTo(map);

  // USER MARKER
  let userMarker = L.marker(latlng).addTo(map);

  // NEAREST POINT
  let coords = nearest.geometry.coordinates;
  let nearestMarker = L.circleMarker([coords[1], coords[0]], {
    radius: 6
  }).addTo(map);

  // LINE
  let line = L.polyline([
    latlng,
    [coords[1], coords[0]]
  ]).addTo(map);

  // POPUP
  L.popup()
    .setLatLng(latlng)
    .setContent(
      "<b>" + currentFeature.properties.name + "</b><br>" +
      "Zgrešil si: <b>" + km + " km</b><br><br>" +
      currentFeature.properties.info
    )
    .openOn(map);

  setTimeout(() => {
    map.removeLayer(layer);
    map.removeLayer(userMarker);
    map.removeLayer(nearestMarker);
    map.removeLayer(line);
    startRound();
  }, 2500);
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
