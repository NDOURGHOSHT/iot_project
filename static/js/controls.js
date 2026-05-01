const onLabels  = { lampe1:'Allumée', lampe2:'Allumée', ventilateur:'En marche', fenetre1:'Ouverte', fenetre2:'Ouverte' };
const offLabels = { lampe1:'Éteinte', lampe2:'Éteinte', ventilateur:'Arrêté',    fenetre1:'Fermée',  fenetre2:'Fermée' };
const names     = { lampe1:'Lampe 1', lampe2:'Lampe 2', ventilateur:'Ventilateur', fenetre1:'Fenêtre 1', fenetre2:'Fenêtre 2' };
const devices   = ['lampe1','lampe2','ventilateur','fenetre1','fenetre2'];
let logs = [];
let currentMode = 'auto';

function setMode(m) {
  currentMode = m;
  document.getElementById('btn-auto').classList.toggle('active', m === 'auto');
  document.getElementById('btn-manuel').classList.toggle('active', m === 'manuel');
  devices.forEach(id => {
    document.getElementById('toggle-' + id).disabled = m === 'auto';
  });
  fetch('/api/commands', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode: m })
  });
}

function toggleDevice(id, val) {
  updateCard(id, val);
  addLog(id, val);
  fetch('/api/commands', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ [id]: val })
  }).catch(err => console.error('Erreur:', err));
}

function updateCard(id, val) {
  document.getElementById('card-' + id).classList.toggle('on', val);
  document.getElementById('icon-' + id).classList.toggle('on', val);
  const s = document.getElementById('status-' + id);
  s.textContent = val ? onLabels[id] : offLabels[id];
  s.className = 'ctrl-status' + (val ? ' on' : '');
  document.getElementById('toggle-' + id).checked = val;
}

function addLog(id, val) {
  const time = new Date().toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit', second:'2-digit' });
  logs.unshift({ name: names[id], val, time });
  if (logs.length > 5) logs.pop();
  document.getElementById('log-list').innerHTML = logs.map(l =>
    `<div class="log-entry">
      <span class="log-name">${l.name}</span>
      <span class="log-time">${l.time}</span>
      <span class="log-badge ${l.val ? 'badge-on' : 'badge-off'}">${l.val ? 'ON' : 'OFF'}</span>
    </div>`
  ).join('');
}

// sync état depuis Flask au chargement
function syncState() {
  fetch('/api/commands')
    .then(res => res.json())
    .then(state => {
      if (state.mode) setMode(state.mode);
      devices.forEach(id => {
        if (id in state) updateCard(id, state[id]);
      });
    })
    .catch(err => console.error('Sync erreur:', err));
}

// sync toutes les 10 secondes
syncState();
setInterval(syncState, 10000);