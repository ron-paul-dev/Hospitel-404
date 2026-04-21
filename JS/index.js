document.addEventListener("DOMContentLoaded", function () {
    const hamburger = document.getElementById("hamburger");
    const navLinks  = document.getElementById("navLinks");
    if (hamburger) {
        hamburger.addEventListener("click", function () {
            navLinks.classList.toggle("active");
            hamburger.textContent = navLinks.classList.contains("active") ? "✖" : "☰";
        });
    }
});
