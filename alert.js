document.getElementById("menuToggle").onclick = () => {
  document.querySelector(".sidebar").classList.toggle("show");
};

const alertTableBody = document.querySelector("#alertTable tbody");

function addAlert(noise, sensor = "Sensor 1") {
  const now = new Date();
  const time = now.toLocaleTimeString();
  const date = now.toLocaleDateString();

  const row = document.createElement("tr");
  row.innerHTML = `
    <td>${time}</td>
    <td>${date}</td>
    <td>${noise}</td>
    <td>${sensor}</td>
  `;

  alertTableBody.prepend(row); 

  if (alertTableBody.rows.length > 10) {
    alertTableBody.deleteRow(alertTableBody.rows.length - 1);
  }
}

setInterval(() => {
  const simulatedNoise = Math.floor(Math.random() * 100);
  if (simulatedNoise >= 80) { 
    addAlert(simulatedNoise);
  }
}, 2500);