document.getElementById("loginBtn").addEventListener("click", () => {
  const name = document.getElementById("loginName").value.trim();
  const pass = document.getElementById("loginPassword").value.trim();

  if(!name || !pass) {
    alert("Enter both name and password!");
    return;
  }

  const storedPass = localStorage.getItem("user_" + name);

  if(!storedPass) {
    alert("User does not exist! Please register first.");
    window.location.href = "register.html";
    return;
  }

  if(pass !== storedPass) {
    alert("Wrong password!");
    return;
  }

  // Save current logged-in user
  localStorage.setItem("currentUser", name);
  window.location.href = ("admin.html"),
  localStorage.setItem("user_" + name, password);

  alert("Registration successful! You can now login.");
  window.location.href = "index.html"; // redirect to login page
});