import { STACK, ALL, svgMarkup } from './logos.js';

// Language switch, logo rows, live Tunis clock, chapter counter, cursor and e-mail copy.
export function initUI() {
  const root = document.documentElement;

  function setLang(lang, save) {
    root.dataset.lang = lang;
    root.lang = lang;
    document.getElementById('lang-fr').setAttribute('aria-pressed', String(lang === 'fr'));
    document.getElementById('lang-en').setAttribute('aria-pressed', String(lang === 'en'));
    if (save) {
      try { localStorage.setItem('portfolio-lang', lang); } catch { /* storage blocked */ }
    }
  }
  const fromHash = () => {
    const h = location.hash.replace('#', '');
    return h === 'en' || h === 'fr' ? h : null;
  };
  let initial = fromHash();
  if (!initial) {
    try { initial = localStorage.getItem('portfolio-lang'); } catch { /* storage blocked */ }
  }
  if (!initial && navigator.language && !navigator.language.startsWith('fr')) initial = 'en';
  setLang(initial === 'en' ? 'en' : 'fr', false);
  window.addEventListener('hashchange', () => { const l = fromHash(); if (l) setLang(l, true); });
  document.querySelectorAll('.lang button').forEach((b) => b.addEventListener('click', () => setLang(b.dataset.lang, true)));

  // Logo rows and the closing marquee (list doubled so the loop is seamless).
  document.querySelectorAll('[data-logos]').forEach((el) => {
    const key = el.dataset.logos;
    const list = key === 'all' ? [...ALL, ...ALL] : key === 'ops' ? [...STACK.ops, ...STACK.data.slice(0, 2)] : STACK[key];
    el.innerHTML = list.map((l) => `<li><span style="color:${l.color}">${svgMarkup(l, 16)}</span>${l.label}</li>`).join('');
  });

  document.querySelectorAll('[data-scroll]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const target = document.getElementById(a.dataset.scroll);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  // Live time in Tunis: a small real detail in the header.
  const clock = document.getElementById('clock');
  const fmt = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Tunis' });
  const tick = () => { clock.textContent = `Tunis · ${fmt.format(new Date())}`; };
  tick();
  setInterval(tick, 20000);

  // Cursor
  const cursor = document.getElementById('cursor');
  if (window.matchMedia('(pointer: fine)').matches && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.body.classList.add('has-cursor');
    let x = 0, y = 0, cx = 0, cy = 0;
    window.addEventListener('pointermove', (e) => { x = e.clientX; y = e.clientY; cursor.classList.add('on'); }, { passive: true });
    document.addEventListener('pointerover', (e) => cursor.classList.toggle('hover', !!e.target.closest('a, button, code')));
    const loop = () => {
      cx += (x - cx) * 0.2; cy += (y - cy) * 0.2;
      cursor.style.transform = `translate(${cx}px, ${cy}px)`;
      requestAnimationFrame(loop);
    };
    loop();
  }

  const status = document.getElementById('copy-status');
  document.getElementById('copy-email').addEventListener('click', () => {
    const email = document.getElementById('email');
    const en = root.dataset.lang === 'en';
    const select = () => {
      const range = document.createRange();
      range.selectNodeContents(email);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      status.textContent = en ? 'Selected, press Ctrl+C' : 'Sélectionné, faites Ctrl+C';
    };
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(email.textContent).then(() => { status.textContent = en ? 'Copied' : 'Copié'; }, select);
    } else {
      select();
    }
  });

  document.getElementById('year').textContent = String(new Date().getFullYear());

  // Stack chips by label (data-logo-list="React,NestJS,…").
  document.querySelectorAll('[data-logo-list]').forEach((el) => {
    el.innerHTML = el.dataset.logoList.split(',')
      .map((name) => ALL.find((l) => l.label === name.trim()))
      .filter(Boolean)
      .map((l) => `<li><span style="color:${l.color}">${svgMarkup(l, 16)}</span>${l.label}</li>`).join('');
  });

  // Horizontal swipe on touch screens; a tap still counts as a click.
  function onSwipe(el, left, right) {
    let x0 = null, y0 = 0;
    el.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
    el.addEventListener('touchend', (e) => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
      x0 = null;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        el.dataset.swiped = '1';
        setTimeout(() => { delete el.dataset.swiped; }, 350);
        (dx < 0 ? left : right)();
      }
    }, { passive: true });
  }

  // Lightbox for captures and the demo video (arrows, Escape to close).
  const box = document.getElementById('lightbox');
  const boxImg = document.getElementById('lb-img');
  const boxVideo = document.getElementById('lb-video');
  const boxCap = document.getElementById('lb-cap');
  let gallery = [];
  let current = 0;
  let galleryTitle = '';
  function show(i) {
    current = (i + gallery.length) % gallery.length;
    boxImg.src = `images/projects/${gallery[current]}.jpg`;
    boxImg.alt = `${galleryTitle} ${current + 1}`;
    boxCap.textContent = `${galleryTitle} · ${current + 1} / ${gallery.length}`;
  }
  function openGallery(shots, title, index) {
    gallery = shots; galleryTitle = title;
    boxVideo.hidden = true; boxImg.hidden = false;
    box.classList.remove('is-video');
    show(index);
    box.hidden = false;
    document.getElementById('lb-close').focus();
  }
  function close() {
    box.hidden = true;
    boxVideo.pause();
  }
  document.querySelectorAll('[data-video]').forEach((btn) => {
    btn.addEventListener('click', () => {
      gallery = [];
      boxImg.hidden = true; boxVideo.hidden = false;
      box.classList.add('is-video');
      boxVideo.poster = btn.dataset.poster || '';
      if (boxVideo.getAttribute('src') !== btn.dataset.video) boxVideo.src = btn.dataset.video;
      boxCap.textContent = 'LegalTech · démo';
      box.hidden = false;
      boxVideo.play().catch(() => {});
    });
  });
  document.getElementById('lb-close').addEventListener('click', close);
  document.getElementById('lb-prev').addEventListener('click', () => gallery.length && show(current - 1));
  document.getElementById('lb-next').addEventListener('click', () => gallery.length && show(current + 1));
  box.addEventListener('click', (e) => { if (e.target === box) close(); });
  onSwipe(box, () => gallery.length && show(current + 1), () => gallery.length && show(current - 1));
  window.addEventListener('keydown', (e) => {
    if (box.hidden) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowRight' && gallery.length) show(current + 1);
    if (e.key === 'ArrowLeft' && gallery.length) show(current - 1);
  });

  // Carousels: crossfading captures with a slow zoom, dots, pause on hover.
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('.carousel[data-shots]').forEach((el) => {
    const shots = el.dataset.shots.split(',');
    el.innerHTML = `<div class="frame-bar"><i></i><i></i><i></i><span>${el.dataset.title}</span></div>
      <div class="slides">${shots.map((s, i) => `<button type="button" class="slide${i === 0 ? ' on' : ''}" data-i="${i}" aria-label="${el.dataset.title} ${i + 1}"><img src="images/projects/${s}.jpg" alt="" loading="lazy"></button>`).join('')}</div>
      <div class="dots">${shots.map((_, i) => `<span class="${i === 0 ? 'on' : ''}"></span>`).join('')}</div>`;
    const slides = [...el.querySelectorAll('.slide')];
    const dots = [...el.querySelectorAll('.dots span')];
    let i = 0;
    let paused = false;
    const go = (n) => {
      slides[i].classList.remove('on'); dots[i].classList.remove('on');
      i = (n + slides.length) % slides.length;
      slides[i].classList.add('on'); dots[i].classList.add('on');
    };
    el.addEventListener('pointerenter', () => { paused = true; });
    el.addEventListener('pointerleave', () => { paused = false; });
    el.addEventListener('click', (e) => {
      if (el.dataset.swiped) return;
      const slide = e.target.closest('.slide');
      if (slide) openGallery(shots, el.dataset.title, Number(slide.dataset.i));
    });
    onSwipe(el, () => go(i + 1), () => go(i - 1));
    if (!reduce) setInterval(() => { if (!paused && !document.hidden) go(i + 1); }, 3200 + Math.random() * 800);
  });

  // Cards tilt toward the pointer and carry a soft light under it.
  if (window.matchMedia('(pointer: fine)').matches && !reduce) {
    document.querySelectorAll('[data-tilt]').forEach((card) => {
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        card.style.setProperty('--rx', `${(0.5 - y) * 6}deg`);
        card.style.setProperty('--ry', `${(x - 0.5) * 8}deg`);
        card.style.setProperty('--gx', `${x * 100}%`);
        card.style.setProperty('--gy', `${y * 100}%`);
      });
      card.addEventListener('pointerleave', () => {
        card.style.setProperty('--rx', '0deg');
        card.style.setProperty('--ry', '0deg');
      });
    });
  }

  // Cards rise into place as they enter the viewport (they stay visible either way).
  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver((entries) => entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    }), { threshold: 0.15 });
    document.querySelectorAll('.project, .glass').forEach((el) => { el.classList.add('rise'); io.observe(el); });
  }

  const now = document.getElementById('chapter-now');
  const total = document.getElementById('chapter-total');
  const bar = document.getElementById('chapter-bar');
  return {
    setChapter(i, count) {
      now.textContent = String(i + 1).padStart(2, '0');
      total.textContent = String(count).padStart(2, '0');
      bar.style.width = `${((i + 1) / count) * 100}%`;
    },
  };
}
