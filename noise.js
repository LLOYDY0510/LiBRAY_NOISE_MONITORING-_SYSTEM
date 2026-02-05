
document.getElementById("menuToggle").onclick = () => {
  document.querySelector(".sidebar").classList.toggle("show");
};


const currentEl = document.getElementById("currentNoise");
const maxEl = document.getElementById("maxNoise");
const avgEl = document.getElementById("avgNoise");


let noiseValues = [];
let maxNoise = 0;

function updateNoise(noise) {
  noiseValues.push(noise);

  if (noise > maxNoise) maxNoise = noise;

  const avg = Math.round(noiseValues.reduce((a,b)=>a+b,0)/noiseValues.length);

  currentEl.textContent = noise + " dB";
  maxEl.textContent = maxNoise + " dB";
  avgEl.textContent = avg + " dB";
}

setInterval(() => {
  const simulatedNoise = Math.floor(Math.random() * 100);
  updateNoise(simulatedNoise);
}, 1000);