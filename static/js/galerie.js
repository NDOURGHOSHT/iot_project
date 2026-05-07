const ESP32_STREAM = "/api/stream";
let capturedData = null;

// ===== CAMÉRA =====
function openCamOverlay() {
  const img = document.getElementById('esp32-stream');
  img.src = ESP32_STREAM;
  img.style.display = 'block';
  document.getElementById('cam-placeholder').style.display = 'none';
  document.getElementById('cam-status').textContent = 'ESP32-CAM active';
}

function stopCam() {
  const img = document.getElementById('esp32-stream');
  img.src = '';
  img.style.display = 'none';
  document.getElementById('cam-placeholder').style.display = 'block';
  document.getElementById('cam-status').textContent = 'Caméra arrêtée';
}

// ===== CAPTURE =====
function capture() {
  const img = document.getElementById('esp32-stream');
  if (!img.src || img.style.display === 'none') {
    alert('Démarrez la caméra d\'abord');
    return;
  }

  // dessiner le frame actuel sur un canvas
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth || 640;
  canvas.height = img.naturalHeight || 480;
  canvas.getContext('2d').drawImage(img, 0, 0);
  capturedData = canvas.toDataURL('image/jpeg', 0.8);

  saveCapture();
}

function saveCapture() {
  if (!capturedData) return;
  fetch('/api/capture', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: capturedData, source: 'esp32cam' })
  })
  .then(res => res.json())
  .then(() => {
    capturedData = null;
    loadGallery();
  })
  .catch(err => console.error('Erreur capture:', err));
}

// ===== GALERIE =====
function loadGallery() {
  fetch('/api/captures')
    .then(res => res.json())
    .then(data => {
      const grid = document.getElementById('gallery-grid');
      document.getElementById('capture-count').textContent = data.length;

      if (data.length === 0) {
        grid.innerHTML = `
          <div style="grid-column:span 2;" class="text-center text-muted py-5">
            <i class="bi bi-images" style="font-size:40px;"></i>
            <p class="mt-2 mb-0">Aucune capture disponible</p>
          </div>`;
        return;
      }

      grid.innerHTML = data.map(c => `
        <div style="position:relative;">
          <img src="${c.image}"
               onclick="viewCapture('${c.image}')"
               style="width:100%; height:140px; object-fit:cover; border-radius:10px; cursor:pointer; border:0.5px solid #e0e0e0;">
          <span style="position:absolute; bottom:6px; left:6px; font-size:10px; padding:3px 6px; border-radius:6px; background:rgba(0,0,0,0.55); color:#fff;">
            ${c.timestamp}
          </span>
        </div>
      `).join('');
    });
}

// ===== MODAL =====
function viewCapture(src) {
  document.getElementById('modal-img').src = src;
  document.getElementById('modal').style.display = 'flex';
}

function closeModal() {
  document.getElementById('modal').style.display = 'none';
}

// ===== INIT =====
loadGallery();