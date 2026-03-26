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

let bestScore = localStorage.getItem("bestScore");
if (bestScore !== null) {
  bestScore = Number(bestScore);
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

  clickEnabled = true;

  currentFeature = features[Math.floor(Math.random() * features.length)];
  alert("Najdi: " + currentFeature.properties.name);

  // poslušaj oba dogodka
  map.once("click", handleMapInteraction);
  map.once("touchend", handleMapInteraction);
}

function handleMapInteraction(e) {
  if (!clickEnabled) return;
  clickEnabled = false;

  let latlng;

  // če je normalen klik
  if (e.latlng) {
    latlng = e.latlng;
  } 
  // če je touch event
  else if (e.originalEvent && e.originalEvent.changedTouches) {
    let touch = e.originalEvent.changedTouches[0];
    latlng = map.mouseEventToLatLng(touch);
  } else {
    return;
  }

  onMapClick({ latlng });
}

function onMapClick(e) {
  let userPoint = turf.point([e.latlng.lng, e.latlng.lat]);

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

  let layer = L.geoJSON(currentFeature, {
    style: { color: "red", weight: 2 }
  }).addTo(map);

  let userMarker = L.marker(e.latlng).addTo(map);

  let nearestCoords = nearest.geometry.coordinates;
  let nearestMarker = L.circleMarker([nearestCoords[1], nearestCoords[0]], {
    radius: 6
  }).addTo(map);

  let line = L.polyline([
    e.latlng,
    [nearestCoords[1], nearestCoords[0]]
  ]).addTo(map);

  L.popup()
    .setLatLng(e.latlng)
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
