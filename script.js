let map = L.map('map').setView([44,17],6);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

let features = [];
let currentFeature;
let roundCount = 0;
let totalDistance = 0;
let guessLatLng = null;
let guessMarker = null;

let bestScore = parseInt(localStorage.getItem("bestScore"));
if(bestScore) document.getElementById("best").textContent = bestScore;

let polyLayer, nearestMarker, line;

// NALOŽI GEOJSON
fetch("locations.geojson")
  .then(r => r.json())
  .then(data => { features = data.features; startRound(); })
  .catch(err=>{ alert("GeoJSON ni naložen"); console.error(err); });

// klik na mapo
map.on("click", function(e){
  guessLatLng = e.latlng;
  if(guessMarker) map.removeLayer(guessMarker);
  guessMarker = L.marker(e.latlng).addTo(map);
});

// poslušalci
document.getElementById("confirmBtn").addEventListener("click", confirmGuess);

document.getElementById("nextBtn").addEventListener("click", ()=>{
  document.getElementById("infoBox").style.display="none";
  if(polyLayer) map.removeLayer(polyLayer);
  if(nearestMarker) map.removeLayer(nearestMarker);
  if(line) map.removeLayer(line);
  if(guessMarker){ map.removeLayer(guessMarker); guessMarker=null; }
  startRound();
});

function startRound(){
  if(roundCount>=10) return endGame();
  guessLatLng=null;
  if(guessMarker){ map.removeLayer(guessMarker); guessMarker=null; }
  currentFeature = features[Math.floor(Math.random()*features.length)];
  document.getElementById("task").textContent = "Najdi: " + currentFeature.properties.name;
}

function confirmGuess(){
  if(!guessLatLng){ alert("Najprej klikni na zemljevid!"); return; }

  let userPoint = turf.point([guessLatLng.lng, guessLatLng.lat]);
  let polygon = currentFeature.geometry;

  // preveri, če je znotraj poligona
  let isInside = turf.booleanPointInPolygon(userPoint, polygon);

  let km;
  if(isInside){
    km = 0;
  } else {
    // poišči najbližjo točko na meji
    let boundary = turf.polygonToLine(currentFeature);
    let nearest = turf.nearestPointOnLine(boundary, userPoint, {units:"kilometers"});
    let nearestPoint = turf.point(nearest.geometry.coordinates);
    km = Math.round(turf.distance(userPoint, nearestPoint, {units:"kilometers"}));
    
    // prikaži na zemljevidu
    nearestMarker = L.circleMarker([nearest.geometry.coordinates[1], nearest.geometry.coordinates[0]],{radius:6}).addTo(map);
    line = L.polyline([guessLatLng,[nearest.geometry.coordinates[1], nearest.geometry.coordinates[0]]]).addTo(map);
  }

  totalDistance += km;
  roundCount++;
  document.getElementById("count").textContent = roundCount;
  document.getElementById("total").textContent = totalDistance;

  // prikaži poligon
  polyLayer = L.geoJSON(currentFeature,{style:{color:"red"}}).addTo(map);

  // prikaži infoBox
  document.getElementById("infoTitle").textContent = currentFeature.properties.name;
  document.getElementById("infoText").textContent = currentFeature.properties.info + 
        (km>0 ? `\nRazdalja: ${km} km` : "\nTočka je znotraj poligona! Razdalja: 0 km");
  document.getElementById("infoBox").style.display="block";
}

function endGame(){
  alert("Konec! Skupaj: "+totalDistance+" km");
  if(!bestScore || totalDistance<bestScore){
    localStorage.setItem("bestScore", totalDistance);
    document.getElementById("best").textContent = totalDistance;
    alert("Nov rekord!");
  }
  if(confirm("Ponovi igro?")){
    roundCount=0; totalDistance=0;
    document.getElementById("count").textContent=0;
    document.getElementById("total").textContent=0;
    startRound();
  }
}
