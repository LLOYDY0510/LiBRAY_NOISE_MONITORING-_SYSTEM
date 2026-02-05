document.addEventListener('DOMContentLoaded', () => {
const loggedInUser = localStorage.getItem('loggedInUser');
    if(!localStorage.getItem("currentUser")) {
    alert("Please login first!");
    window.location.href = "index.html";
    }
 document.getElementById('adminName').textContent = loggedInUser;
 const adminName = localStorage.getItem("currentUser") || "Admin";
const adminProfile = JSON.parse(localStorage.getItem('adminProfile')) || {
   
        age: '22',
        dob: '2003-05-15',
        address: 'Manolo, Philippines'
    };
document.getElementById("adminName").textContent = adminName;
    document.getElementById('adminAge').textContent = adminProfile.age;
    document.getElementById('adminDOB').textContent = adminProfile.dob;
    document.getElementById('adminAddress').textContent = adminProfile.address;
});
