// Loading screen styled as `docker compose up`: one line per real service of the
// Technozor platform, ticking in as the 3D assets load.
const SERVICES = ['web-app-1', 'web-app-2', 'api', 'ai-service', 'mysql', 'redis', 'qdrant', 'ollama', 'rustfs', 'livekit', 'nginx'];

export function createBoot(el) {
  const list = el.querySelector('#boot-lines');
  const pct = el.querySelector('#boot-pct');
  let shown = 0;
  let value = 0;
  let finished = false;

  function render(p) {
    value = Math.max(value, p);
    pct.textContent = String(Math.round(value * 100)).padStart(3, '0');
    const target = Math.round(value * SERVICES.length);
    while (shown < target) {
      const li = document.createElement('li');
      li.textContent = `Container ${SERVICES[shown]}  Started`;
      list.appendChild(li);
      shown++;
    }
  }

  // Keep the screen moving even when there is little to download.
  let fake = 0;
  const timer = setInterval(() => {
    fake = Math.min(0.9, fake + 0.09);
    render(fake);
  }, 90);

  function finish() {
    if (finished) return;
    finished = true;
    clearInterval(timer);
    render(1);
    setTimeout(() => el.classList.add('done'), 350);
  }
  // Never block the page: give up on the boot screen after 6 seconds.
  setTimeout(finish, 6000);

  return { progress: (p) => render(Math.min(0.95, p)), finish };
}
