let stream = null;
let capturedData = null;

async function startCam() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: true });
    const video = document.getElementById('video');
    video.srcObject = stream;
    video.style.display = 'block';
    document.getElementById('cam-placeholder').style.display = 'none';
    document.getElementById('cam-status').textContent = 'Caméra active';
  } catch (err) {
    document.getElementById('cam-status').textContent = 'Accès caméra refusé';
  }
}

function stopCam() {
  if (stream) {
    stream.getTracks().forEach(t => t.stop());
    stream = null;
  }
  document.getElementById('video').style.display = 'none';
  document.getElementById('cam-placeholder').style.display = 'block';
  document.getElementById('cam-status').textContent = 'Caméra arrêtée';
}

function capture() {
  const video = document.getElementById('video');
  if (!stream) { alert('Démarrez la caméra d\'abord'); return; }
  const canvas = document.getElementById('snapshot');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext('2d').drawImage(video, 0, 0);
  capturedData = canvas.toDataURL('image/jpeg', 0.8);
  document.getElementById('preview-img').src = capturedData;
  document.getElementById('capture-preview').style.display = 'block';
}

function saveCapture() {
  if (!capturedData) return;
  fetch('/api/capture', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: capturedData, source: 'webcam' })
  })
  .then(res => res.json())
  .then(() => {
    cancelCapture();
    loadGallery();
  });
}

function cancelCapture() {
  capturedData = null;
  document.getElementById('capture-preview').style.display = 'none';
}

function loadGallery() {
  fetch('/api/captures')
    .then(res => res.json())
    .then(data => {
      const grid = document.getElementById('gallery-grid');
      document.getElementById('capture-count').textContent = data.length + ' captures';
      if (data.length === 0) {
        grid.innerHTML = '<div style="grid-column:span 2; text-align:center; color:#aaa; padding:2rem 0;"><i class="bi bi-images" style="font-size:32px;"></i><p style="font-size:13px; margin-top:8px;">Aucune capture</p></div>';
        return;
      }
      grid.innerHTML = data.map(c => `
        <div style="position:relative;">
          <img src="${c.image}" style="width:100%; border-radius:8px; border:0.5px solid #e0e0e0; cursor:pointer;" onclick="viewCapture('${c.image}')">
          <span style="position:absolute; bottom:4px; left:4px; background:rgba(0,0,0,0.5); color:#fff; font-size:10px; padding:2px 6px; border-radius:4px;">${c.timestamp}</span>
        </div>
      `).join('');
    });
}

function viewCapture(src) {
  document.getElementById('modal-img').src = src;
  document.getElementById('modal').style.display = 'flex';
}

function closeModal() {
  document.getElementById('modal').style.display = 'none';
}