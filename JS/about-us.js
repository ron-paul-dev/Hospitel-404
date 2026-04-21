// Scroll reveal
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.15 });

document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

// Animated stat counters
function animateCounter(el, target, suffix) {
  let start = 0;
  const duration = 1800;
  const step = (timestamp) => {
    if (!start) start = timestamp;
    const progress = Math.min((timestamp - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.floor(eased * target) + suffix;
    if (progress < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

// Trigger counter animation when hero loads
setTimeout(() => {
  const statTexts = document.querySelectorAll('.stat-text');
  const data = [
    { el: statTexts[0], target: 1000, suffix: '+ Bed Capacity' },
    { el: statTexts[1], target: 10,   suffix: 'M+ Treated Patients' },
    { el: statTexts[2], target: 128,  suffix: '+ Medical Equipments' },
  ];
  data.forEach(d => animateCounter(d.el, d.target, d.suffix));
}, 800);
