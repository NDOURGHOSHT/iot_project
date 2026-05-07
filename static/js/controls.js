let logs = [];
let currentMode = 'auto';
let debounceTimer = null;

// ===== COULEUR JAUGE =====
function gaugeColor(pct) {
  if (pct === 0) return '#eee';
  if (pct < 40) return '#639922';
  if (pct < 70) return '#EF9F27';
  return '#E24B4A';
}

// ===== MODE AUTO/MANUEL =====
function setMode(m) {
  currentMode = m;
  document.getElementById('btn-auto').classList.toggle('active', m === 'auto');
  document.getElementById('btn-manuel').classList.toggle('active', m === 'manuel');
  ['lampe', 'ventilateurs', 'fenetre', 'porte'].forEach(id => {
    document.getElementById('slider-' + id).disabled = m === 'auto';
  });
  document.getElementById('toggle-chauffage').disabled = m === 'auto';
  sendCommand({ mode: m });
}

// ===== SLIDERS PWM =====
function updateSlider(id, val) {
  const pct = Math.round(val / 255 * 100);
  document.getElementById('val-' + id).textContent = pct + '%';
  setGauge(id, pct);
  document.getElementById('card-' + id).style.borderColor = pct > 0 ? '#97C459' : '#e0e0e0';
  addLog(id === 'lampe' ? 'Lampe' : 'Ventilateurs', pct + '%');
  sendCommand({ [id]: parseInt(val) });
}

// ===== SERVOS =====
function updateServo(id, val, max) {
  const pct = Math.round(val / max * 100);
  document.getElementById('val-' + id).textContent = id === 'fenetre' ? val + '°' : pct + '%';
  setGauge(id, pct);
  document.getElementById('card-' + id).style.borderColor = parseInt(val) > 0 ? '#97C459' : '#e0e0e0';
  addLog(id === 'fenetre' ? 'Fenêtre' : 'Porte', val + '°');
  sendCommand({ [id]: parseInt(val) });
}

// ===== CHAUFFAGE =====
function toggleChauffage(val) {
  document.getElementById('val-chauffage').textContent = val ? 'Allumée' : 'Éteinte';
  document.getElementById('val-chauffage').style.color = val ? '#3B6D11' : '#888';
  document.getElementById('card-chauffage').style.borderColor = val ? '#97C459' : '#e0e0e0';
  addLog('Lampe thermique', val ? 'ON' : 'OFF');
  sendCommand({ chauffage: val });
}

// ===== JAUGE =====
function setGauge(id, pct) {
  const g = document.getElementById('gauge-' + id);
  if (!g) return;
  g.style.width = pct + '%';
  g.style.background = gaugeColor(pct);
}

// ===== JOURNAL =====
function addLog(name, val) {
  const time = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  logs.unshift({ name, val, time });
  if (logs.length > 5) logs.pop();
  document.getElementById('log-list').innerHTML = logs.map(l =>
    `<div class="log-entry">
      <span>${l.name}</span>
      <span style="font-size:12px;color:#888">${l.time}</span>
      <span class="log-badge">${l.val}</span>
    </div>`
  ).join('');
}

// ===== ENVOI COMMANDE =====
function sendCommand(data) {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    fetch('/api/commands', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).catch(err => console.error('Erreur:', err));
  }, 300);
}

// ===== SYNC ÉTAT FLASK =====
function applyState(state) {
  if (state.mode) {
    currentMode = state.mode;
    document.getElementById('btn-auto').classList.toggle('active', state.mode === 'auto');
    document.getElementById('btn-manuel').classList.toggle('active', state.mode === 'manuel');
    ['lampe', 'ventilateurs', 'fenetre', 'porte'].forEach(id => {
      document.getElementById('slider-' + id).disabled = state.mode === 'auto';
    });
    document.getElementById('toggle-chauffage').disabled = state.mode === 'auto';
  }

  if ('lampe' in state) {
    const pct = Math.round(state.lampe / 255 * 100);
    document.getElementById('slider-lampe').value = state.lampe;
    document.getElementById('val-lampe').textContent = pct + '%';
    setGauge('lampe', pct);
    document.getElementById('card-lampe').style.borderColor = pct > 0 ? '#97C459' : '#e0e0e0';
  }

  if ('ventilateurs' in state) {
    const pct = Math.round(state.ventilateurs / 255 * 100);
    document.getElementById('slider-ventilateurs').value = state.ventilateurs;
    document.getElementById('val-ventilateurs').textContent = pct + '%';
    setGauge('ventilateurs', pct);
    document.getElementById('card-ventilateurs').style.borderColor = pct > 0 ? '#97C459' : '#e0e0e0';
  }

  if ('fenetre' in state) {
    const pct = Math.round(state.fenetre / 90 * 100);
    document.getElementById('slider-fenetre').value = state.fenetre;
    document.getElementById('val-fenetre').textContent = state.fenetre + '°';
    setGauge('fenetre', pct);
    document.getElementById('card-fenetre').style.borderColor = state.fenetre > 0 ? '#97C459' : '#e0e0e0';
  }

  if ('porte' in state) {
    const pct = Math.round(state.porte / 180 * 100);
    document.getElementById('slider-porte').value = state.porte;
    document.getElementById('val-porte').textContent = pct + '%';
    setGauge('porte', pct);
    document.getElementById('card-porte').style.borderColor = state.porte > 0 ? '#97C459' : '#e0e0e0';
  }

  if ('chauffage' in state) {
    document.getElementById('toggle-chauffage').checked = state.chauffage;
    document.getElementById('val-chauffage').textContent = state.chauffage ? 'Allumée' : 'Éteinte';
    document.getElementById('val-chauffage').style.color = state.chauffage ? '#3B6D11' : '#888';
    document.getElementById('card-chauffage').style.borderColor = state.chauffage ? '#97C459' : '#e0e0e0';
  }
}

// ===== INIT =====
fetch('/api/commands')
  .then(res => res.json())
  .then(state => applyState(state));

setInterval(() => {
  fetch('/api/commands')
    .then(res => res.json())
    .then(state => applyState(state));
}, 30000);