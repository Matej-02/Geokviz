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
    console.log("GeoJSON OK", data);
    features = data.features;
    startRound();
  })
  .catch(err => {
    console.error("GeoJSON ERROR:", err);
    alert("Napaka pri nalaganju GeoJSON");
  });

function startRound() {
  if (roundCount === 10) {
    endGame();
    return;
  }

  clickEnabled = true;

  currentFeature = features[Math.floor(Math.random() * features.length)];

  alert("Najdi: " + currentFeature.properties.name);

  // NAJBOLJ ZANESLJIVO
  map.once("click", onMapClick);
}

function onMapClick(e) {
  if (!clickEnabled) return;
  clickEnabled = false;

  console.log("KLIK:", e.latlng);

  try {
    let userPoint = turf.point([e.latlng.lng, e.latlng.lat]);

    // 🔥 pomembno: podpira Polygon IN MultiPolygon
    let boundary = turf.polygonToLine(currentFeature);

    let nearest = turf.nearestPointOnLine(boundary, userPoint, {
      units: "kilometers"
    });

    let distKm = nearest.properties.dist || 0;
    let km = Math.round(distKm);

    totalDistance += km;
    roundCount++;

    document.getElementById("count").textContent = roundCount;
    document.getElementById("total").textContent = totalDistance;

    let layer = L.geoJSON(currentFeature, {
      style: { color: "red", weight: 2 }
    }).addTo(map);

    let userMarker = L.marker(e.latlng).addTo(map);

    let coords = nearest.geometry.coordinates;
    let nearestMarker = L.circleMarker([coords[1], coords[0]], {
      radius: 6
    }).addTo(map);

    let line = L.polyline([
      e.latlng,
      [coords[1], coords[0]]
    ]).addTo(map);

    L.popup()
      .setLatLng(e.latlng)
      .setContent(
        "<b>" + currentFeature.properties.name + "</b><br>" +
        "Zgrešil si: <b>" + km + " km</b>"
      )
      .openOn(map);

    setTimeout(() => {
      map.removeLayer(layer);
      map.removeLayer(userMarker);
      map.removeLayer(nearestMarker);
      map.removeLayer(line);
      startRound();
    }, 2500);

  } catch (err) {
    console.error("NAPAKA:", err);
    alert("Napaka pri izračunu (poglej console)");
    clickEnabled = true;
  }
}

function endGame() {
  alert("KONEC IGRE!\nSkupaj: " + totalDistance + " km");

  if (bestScore === null || totalDistance < bestScore) {
    localStorage.setItem("bestScore", totalDistance);
    document.getElementById("best").textContent = totalDistance;
    alert("REKORD!");
  }

  if (confirm("Ponovi igro?")) {
    roundCount = 0;
    totalDistance = 0;
    document.getElementById("count").textContent = 0;
    document.getElementById("total").textContent = 0;
    startRound();
  }
}
