// Scroll reveal
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

// Submit button with toast
document.getElementById('submitBtn').addEventListener('click', () => {
  const inputs = document.querySelectorAll('.form-card input, .form-card textarea');
  let valid = true;

  inputs.forEach(inp => {
    inp.style.borderColor = '';
    if (!inp.value.trim()) {
      inp.style.borderColor = '#e05c5c';
      valid = false;
    }
  });

  if (!valid) return;

  const toast = document.getElementById('toast');
  toast.classList.add('show');
  inputs.forEach(inp => inp.value = '');
  setTimeout(() => toast.classList.remove('show'), 3000);
});
