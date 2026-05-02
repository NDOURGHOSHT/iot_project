const sensorConfig = {
  temp: { label: 'Température', unit: '°C',  color: '#E24B4A', key: 'temperature', max: 50 },
  hum:  { label: 'Humidité',    unit: '%',   color: '#378ADD', key: 'humidity',    max: 100 },
  ldr:  { label: 'Luminosité',  unit: 'lux', color: '#EF9F27', key: 'ldr',         max: 1024 },
  gaz:  { label: 'Gaz MQ135',   unit: 'ppm', color: '#639922', key: 'mq135',       max: 500 },
  wind: { label: 'Vent',        unit: 'm/s', color: '#534AB7', key: 'wind',        max: 20 }
};

// historique local par capteur
const history = { temp: [], hum: [], ldr: [], gaz: [], wind: [] };
const timeLabels = [];
const MAX_POINTS = 10;
let current = 'temp';

const chart = new Chart(document.getElementById('sensorChart'), {
  type: 'line',
  data: {
    labels: timeLabels,
    datasets: [{
      data: history.temp,
      borderColor: sensorConfig.temp.color,
      backgroundColor: 'transparent',
      tension: 0.4,
      pointRadius: 3,
      pointBackgroundColor: sensorConfig.temp.color
    }]
  },
  options: {
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 11 } } },
      y: { grid: { color: 'rgba(128,128,128,0.1)' }, ticks: { font: { size: 11 } } }
    }
  }
});

function selectSensor(key) {
  document.getElementById('card-' + current).classList.remove('active');
  current = key;
  document.getElementById('card-' + key).classList.add('active');
  const s = sensorConfig[key];
  chart.data.datasets[0].data = history[key];
  chart.data.datasets[0].borderColor = s.color;
  chart.data.datasets[0].pointBackgroundColor = s.color;
  chart.update();
  document.getElementById('chart-title').textContent = s.label + ' — temps réel';
  document.getElementById('chart-subtitle').textContent = 'Unité : ' + s.unit;
}

function updateDashboard(data) {
  const time = new Date().toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit', second:'2-digit'});

  // màj valeurs affichées
  document.getElementById('val-temp').textContent = data.temperature;
  document.getElementById('val-hum').textContent  = data.humidity;
  document.getElementById('val-ldr').textContent  = data.ldr;
  document.getElementById('val-gaz').textContent  = data.mq135;
  document.getElementById('val-wind').textContent = data.wind;

  // màj barres
  document.getElementById('bar-temp').style.width = Math.min(data.temperature / 50 * 100, 100) + '%';
  document.getElementById('bar-hum').style.width  = Math.min(data.humidity, 100) + '%';
  document.getElementById('bar-ldr').style.width  = Math.min(data.ldr / 1024 * 100, 100) + '%';
  document.getElementById('bar-gaz').style.width  = Math.min(data.mq135 / 500 * 100, 100) + '%';
  document.getElementById('bar-wind').style.width = Math.min(data.wind / 20 * 100, 100) + '%';

  // statut ESP32
  const espDot  = document.querySelector('.dot-esp');
  const espVal  = document.querySelector('.val-esp');
  if (data.esp32_online) {
    espDot.className = 'status-dot dot-green';
    espVal.textContent = 'En ligne';
  } else {
    espDot.className = 'status-dot dot-red';
    espVal.textContent = 'Hors ligne';
  }

  // màj historique
  if (timeLabels.length >= MAX_POINTS) timeLabels.shift();
  timeLabels.push(time);

  for (const [id, cfg] of Object.entries(sensorConfig)) {
    if (history[id].length >= MAX_POINTS) history[id].shift();
    history[id].push(data[cfg.key]);
  }

  chart.update();
}

// statut caméra séparé
setInterval(() => {
  fetch('/api/cam-status')
    .then(res => res.json())
    .then(data => {
      const camDot = document.querySelector('.dot-cam');
      const camVal = document.querySelector('.val-cam');
      camDot.className = 'status-dot ' + (data.online ? 'dot-green' : 'dot-red');
      camVal.textContent = data.online ? 'En ligne' : 'Hors ligne';
    });
}, 10000);

// au chargement, pré-remplir avec les dernières données
fetch('/history-data')
  .then(res => res.json())
  .then(data => {
    data.forEach(d => {
      if (timeLabels.length >= MAX_POINTS) timeLabels.shift();
      timeLabels.push(new Date().toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit'}));
      for (const [id, cfg] of Object.entries(sensorConfig)) {
        if (history[id].length >= MAX_POINTS) history[id].shift();
        history[id].push(d[cfg.key]);
      }
    });
    chart.update();
  });

// ensuite ton setInterval existant prend le relais
setInterval(() => {
  fetch('/latest')
    .then(res => res.json())
    .then(data => updateDashboard(data));
}, 5000);
