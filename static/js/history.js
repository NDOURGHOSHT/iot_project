const sensorConfig = {
  temperature: { label: 'Température', unit: '°C',  color: '#E24B4A' },
  humidity:    { label: 'Humidité',    unit: '%',   color: '#378ADD' },
  ldr:         { label: 'Luminosité',  unit: 'lux', color: '#EF9F27' },
  mq135:       { label: 'Gaz MQ135',   unit: 'ppm', color: '#639922' },
  wind:        { label: 'Vent',        unit: 'm/s', color: '#534AB7' }
};

let rawData = [];
let activeKeys = ['temperature'];

const chart = new Chart(document.getElementById('historyChart'), {
  type: 'line',
  data: { labels: [], datasets: [] },
  options: {
    plugins: { legend: { display: true, labels: { font: { size: 12 } } } },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 11 } } },
      y: { grid: { color: 'rgba(128,128,128,0.1)' }, ticks: { font: { size: 11 } } }
    }
  }
});

function buildChart() {
  const labels = rawData.map((_, i) => i + 1);
  chart.data.labels = labels;
  chart.data.datasets = activeKeys.map(key => ({
    label: sensorConfig[key].label + ' (' + sensorConfig[key].unit + ')',
    data: rawData.map(d => d[key]),
    borderColor: sensorConfig[key].color,
    backgroundColor: 'transparent',
    tension: 0.4,
    pointRadius: 3,
    pointBackgroundColor: sensorConfig[key].color
  }));
  chart.update();

  document.getElementById('active-sensors').textContent =
    activeKeys.map(k => sensorConfig[k].label).join(', ');
}

function toggleSensor(key) {
  const idx = activeKeys.indexOf(key);
  const btn = document.getElementById('btn-' + key);
  const label = btn.querySelector('.sensor-value');

  if (idx === -1) {
    activeKeys.push(key);
    btn.classList.add('active');
    label.textContent = 'Affichée';
  } else {
    if (activeKeys.length === 1) return; // garder au moins 1
    activeKeys.splice(idx, 1);
    btn.classList.remove('active');
    label.textContent = 'Masquée';
  }
  buildChart();
}

fetch('/history-data')
  .then(res => res.json())
  .then(data => {
    rawData = data.reverse();
    buildChart();
  })
  .catch(err => console.error('Erreur:', err));
