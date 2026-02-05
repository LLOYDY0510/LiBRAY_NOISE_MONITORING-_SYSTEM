document.addEventListener('DOMContentLoaded', () => {

    // Get logged-in user name
    const loggedInUser = localStorage.getItem('loggedInUser');

    // If not logged in, redirect to login page
    if(!localStorage.getItem("currentUser")) {
    alert("Please login first!");
    window.location.href = "index.html";
    }
    // Display admin name
    document.getElementById('adminName').textContent = loggedInUser;

    // Load admin profile data (example data)
    const adminProfile = JSON.parse(localStorage.getItem('adminProfile')) || {
        age: '22',
        dob: '2003-05-15',
        address: 'Cebu City, Philippines'
    };

    document.getElementById('adminAge').textContent = adminProfile.age;
    document.getElementById('adminDOB').textContent = adminProfile.dob;
    document.getElementById('adminAddress').textContent = adminProfile.address;
});
