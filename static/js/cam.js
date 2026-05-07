// const ESP32_STREAM = "http://192.168.43.200:81/stream";
const ESP32_STREAM = "/api/stream";

function openCamOverlay() {
  const overlay = document.getElementById('cam-overlay');
  const img = document.getElementById('global-stream');
  img.src = ESP32_STREAM;
  overlay.style.display = 'block';
}

function closeCamOverlay() {
  document.getElementById('cam-overlay').style.display = 'none';
  document.getElementById('global-stream').src = '';
}