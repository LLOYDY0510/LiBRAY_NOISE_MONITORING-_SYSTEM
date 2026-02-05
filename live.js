document.getElementById("menuToggle").onclick = () => {
  document.querySelector(".sidebar").classList.toggle("show");
}


const noiseValueEl = document.getElementById("noiseValue");
const noiseStatusEl = document.getElementById("noiseStatus");
const noiseBarEl = document.getElementById("noiseBar");


function updateLiveNoise(noise) {
  noiseValueEl.textContent = noise + " dB";


  if (noise < 60) {
    noiseStatusEl.textContent = "Normal";
    noiseStatusEl.style.color = "green";
    noiseBarEl.classList.remove("bg-warning","bg-danger");
    noiseBarEl.classList.add("bg-success");
  } else if (noise < 80) {
    noiseStatusEl.textContent = "Moderate";
    noiseStatusEl.style.color = "#ffc107";
    noiseBarEl.classList.remove("bg-success","bg-danger");
    noiseBarEl.classList.add("bg-warning");
  } else {
    noiseStatusEl.textContent = "High Alert!";
    noiseStatusEl.style.color = "red";
    noiseBarEl.classList.remove("bg-success","bg-warning");
    noiseBarEl.classList.add("bg-danger");
  }

 
  let width = Math.min(noise, 100);
  noiseBarEl.style.width = width + "%";
}


setInterval(() => {
  const simulatedNoise = Math.floor(Math.random() * 100);
  updateLiveNoise(simulatedNoise);
}, 1000);