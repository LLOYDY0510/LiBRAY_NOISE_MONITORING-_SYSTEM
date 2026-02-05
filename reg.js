document.getElementById("registerBtn").addEventListener("click", () => {
  const name = document.getElementById("regName").value.trim();
  const password = document.getElementById("regPassword").value.trim();
  const confirm = document.getElementById("regConfirm").value.trim();
  const age = document.getElementById("regAge").value.trim();
  const address = document.getElementById("regAddress").value.trim();

  if(!name || !password || !confirm || !age || !address) {
    alert("Fill in all fields!");
    return;
  }

  if(password !== confirm) {
    alert("Passwords do not match!");
    return;
  }

  if(localStorage.getItem("user_" + name)) {
    alert("User already exists! Please login.");
    window.location.href = "index.html";
    return;
  }
  const dob = document.getElementById("regDOB").value.trim();

if(!name || !password || !confirm || !age || !address || !dob) {
  alert("Fill in all fields!");
  return;
}


localStorage.setItem("user_" + name, password);
localStorage.setItem("userAge_" + name, age);
localStorage.setItem("userAddress_" + name, address);
localStorage.setItem("userDOB_" + name, dob);


  localStorage.setItem("user_" + name, password);
  localStorage.setItem("userAge_" + name, age);
  localStorage.setItem("userAddress_" + name, address);

  alert("Registration successful! Please login.");
  window.location.href = "index.html";
});