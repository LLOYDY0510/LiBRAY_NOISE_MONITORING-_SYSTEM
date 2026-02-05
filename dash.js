let noiseValues = [];
let maxNoise = 0;
let alertCount = 0;


const avgEl = document.querySelector(".bg-primary .card-text");
const maxEl = document.querySelector(".bg-success .card-text");
const alertEl = document.querySelector(".bg-warning .card-text");
const sensorEl = document.querySelector(".bg-info .card-text");


sensorEl.textContent = "1";


const ctx = document.getElementById("noiseChart").getContext("2d");
const noiseChart = new Chart(ctx, {
  type: "line",
  data: {
    labels: [],
    datasets: [{
      data: [],
      fill: true,
      tension: 0.3
    }]
  },
  options: {
    responsive: true,
    plugins: { legend: { display: false } }
  }
});


function updateNoiseSystem(noise) {
  noiseValues.push(noise);

  if (noise > maxNoise) maxNoise = noise;

  const avg = Math.round(noiseValues.reduce((a,b)=>a+b,0)/noiseValues.length);

  if (noise >= 80) alertCount++;

  avgEl.textContent = avg + " dB";
  maxEl.textContent = maxNoise + " dB";
  alertEl.textContent = alertCount;

  noiseChart.data.labels.push(new Date().toLocaleTimeString());
  noiseChart.data.datasets[0].data.push(noise);

  if (noiseChart.data.labels.length > 10) {
    noiseChart.data.labels.shift();
    noiseChart.data.datasets[0].data.shift();
  }

  noiseChart.update();
}


setInterval(() => {
  updateNoiseSystem(Math.floor(Math.random() * 100));
}, 1000);


document.addEventListener("DOMContentLoaded", () => {
  new FullCalendar.Calendar(document.getElementById("calendar"), {
    initialView: "dayGridMonth",
    height: 300
  }).render();
});


document.getElementById("menuToggle").onclick = () => {
  document.querySelector(".sidebar").classList.toggle("show");
};