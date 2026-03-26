let map = L.map('map').setView([44,17],6);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

let features = [];
let currentFeature;
let roundCount = 0;
let totalDistance = 0;
let guessLatLng = null;
let guessMarker = null;

let bestScore = localStorage.getItem("bestScore");
if(bestScore) document.getElementById("best").textContent = bestScore;

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

document.getElementById("confirmBtn").addEventListener("click", confirmGuess);

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
  let boundary = turf.polygonToLine(currentFeature);
  let nearest = turf.nearestPointOnLine(boundary, userPoint, {units:"kilometers"});
  let km = Math.round(nearest.properties.dist);

  totalDistance += km;
  roundCount++;

  document.getElementById("count").textContent = roundCount;
  document.getElementById("total").textContent = totalDistance;

  let poly = L.geoJSON(currentFeature,{style:{color:"red"}}).addTo(map);
  let coords = nearest.geometry.coordinates;
  let nearestMarker = L.circleMarker([coords[1],coords[0]],{radius:6}).addTo(map);
  let line = L.polyline([guessLatLng,[coords[1],coords[0]]]).addTo(map);

  setTimeout(()=>{
    map.removeLayer(poly);
    map.removeLayer(nearestMarker);
    map.removeLayer(line);
    if(guessMarker){ map.removeLayer(guessMarker); guessMarker=null; }
    startRound();
  },2000);
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
