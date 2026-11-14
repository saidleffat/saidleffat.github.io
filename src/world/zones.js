import * as THREE from 'three';
import { canvasTexture, drawCodeLine, FONT_MONO, FONT_DISPLAY, FONT_BODY } from './textures.js';
import { STACK } from '../logos.js';

// Everything behind the monitor: a corridor of stars with one set piece per chapter.
// Z positions must match the camera keyframes in scene.js.
export const ZONE_Z = { portrait: -8, dev: -16, ai: -24, ops: -32, work: -40, about: -48, contact: -56 };

export function logoTexture(logo, size = 256) {
  return canvasTexture(size, size, (g, w) => {
    const r = w / 2 - 6;
    const grad = g.createRadialGradient(w / 2, w / 2, r * 0.2, w / 2, w / 2, r);
    grad.addColorStop(0, 'rgba(22,30,40,0.92)');
    grad.addColorStop(1, 'rgba(10,14,20,0.92)');
    g.fillStyle = grad;
    g.beginPath(); g.arc(w / 2, w / 2, r, 0, Math.PI * 2); g.fill();
    g.lineWidth = 3; g.strokeStyle = logo.color; g.globalAlpha = 0.55; g.stroke(); g.globalAlpha = 1;
    const s = (w * 0.46) / 24;
    g.save();
    g.translate(w / 2 - 12 * s, w / 2 - 12 * s);
    g.scale(s, s);
    g.fillStyle = logo.color;
    g.fill(new Path2D(logo.path));
    g.restore();
  }).tex;
}

function logoSprite(logo, scale = 0.42) {
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: logoTexture(logo), transparent: true, depthWrite: false }));
  sprite.scale.setScalar(scale);
  return sprite;
}

export function createStarfield(count) {
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 26;
    pos[i * 3 + 1] = (Math.random() - 0.3) * 16;
    pos[i * 3 + 2] = -2 - Math.random() * 64;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  return new THREE.Points(geo, new THREE.PointsMaterial({ color: 0x9fd9ea, size: 0.03, transparent: true, opacity: 0.8, depthWrite: false }));
}

const SNIPPETS = [
  ['CourseController.java', ['@GetMapping("/{id}")', 'public CourseDto get(Long id) {', '  return service.findById(id);', '}']],
  ['security.java', ['@PreAuthorize("hasRole(\'ADMIN\')")', 'public void publish(Course c) {', '  // JWT + BCrypt + RBAC', '}']],
  ['invoice.service.ts', ['async create(dto: InvoiceDto) {', '  return this.prisma.invoice', '    .create({ data: dto });', '}']],
  ['app.component.ts', ['@Component({ selector: "app-root" })', 'export class AppComponent {', '  lang = signal("fr");', '}']],
];

function codePanel([title, lines]) {
  const { tex } = canvasTexture(640, 300, (g, w, h) => {
    g.fillStyle = 'rgba(9,14,20,0.94)'; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(127,216,232,0.45)'; g.lineWidth = 3; g.strokeRect(1.5, 1.5, w - 3, h - 3);
    g.font = `20px ${FONT_MONO}`; g.fillStyle = '#5d7180'; g.fillText(title, 24, 38);
    g.font = `24px ${FONT_MONO}`;
    lines.forEach((l, i) => drawCodeLine(g, l, 24, 92 + i * 44));
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.75), new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false, side: THREE.DoubleSide }));
  return m;
}

function labelPlane(lines, { w = 1.2, h = 0.5, accent = '#7fd8e8' } = {}) {
  const { tex } = canvasTexture(512, Math.round(512 * (h / w)), (g, cw, ch) => {
    g.fillStyle = 'rgba(9,14,20,0.9)'; g.fillRect(0, 0, cw, ch);
    g.fillStyle = accent; g.fillRect(0, 0, 6, ch);
    g.font = `700 40px ${FONT_DISPLAY}`; g.fillStyle = '#eef4f7'; g.fillText(lines[0], 28, 60);
    g.font = `24px ${FONT_MONO}`; g.fillStyle = '#8fa4b0';
    lines.slice(1).forEach((l, i) => g.fillText(l, 28, 104 + i * 34));
  });
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false, side: THREE.DoubleSide }));
}

// 01 · Dev: floating code panels and the dev stack logos.
function devZone() {
  const g = new THREE.Group();
  g.position.z = ZONE_Z.dev;
  const spots = [[-1.9, 1.9, 0.3, 0.35], [1.7, 2.3, -0.4, -0.3], [-1.4, 0.4, -0.6, 0.25], [1.9, 0.7, 0.2, -0.4]];
  SNIPPETS.forEach((s, i) => {
    const p = codePanel(s);
    p.position.set(spots[i][0], spots[i][1], spots[i][2]);
    p.rotation.y = spots[i][3];
    p.userData.float = i;
    g.add(p);
  });
  const logos = STACK.dev.map((logo, i) => {
    const s = logoSprite(logo, 0.46);
    const a = (i / STACK.dev.length) * Math.PI * 2;
    s.userData = { a, r: 1.15, y: 1.3 };
    g.add(s);
    return s;
  });
  g.userData.logos = logos;
  return g;
}

// 02 · AI: a glowing core, orbiting documents and the AI stack.
function aiZone() {
  const g = new THREE.Group();
  g.position.z = ZONE_Z.ai;
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.55, 2), new THREE.MeshBasicMaterial({ color: 0x7fd8e8, wireframe: true, transparent: true, opacity: 0.7 }));
  core.position.y = 1.3;
  const inner = new THREE.Mesh(new THREE.SphereGeometry(0.16, 32, 16), new THREE.MeshBasicMaterial({ color: 0x8fe3f2 }));
  inner.position.y = 1.3;
  g.add(core, inner);
  const rings = [0, 1, 2].map((i) => {
    const r = new THREE.Mesh(new THREE.TorusGeometry(0.95 + i * 0.32, 0.006, 8, 120), new THREE.MeshBasicMaterial({ color: i === 1 ? 0xf2b35b : 0x7fd8e8, transparent: true, opacity: 0.6 }));
    r.position.y = 1.3;
    r.rotation.set(Math.PI / 2 + i * 0.35, i * 0.6, 0);
    g.add(r);
    return r;
  });
  const docTitles = [['contrat.pdf', 'chunk 12/48'], ['cours-03.pdf', 'chunk 4/31'], ['top-k = 4', 'score 0.82'], ['source cited', 'p. 7']];
  const docs = docTitles.map((t, i) => {
    const d = labelPlane(t, { w: 0.62, h: 0.34, accent: i % 2 ? '#f2b35b' : '#7fd8e8' });
    d.userData = { a: (i / docTitles.length) * Math.PI * 2, r: 1.8 };
    g.add(d);
    return d;
  });
  const logos = STACK.ai.map((logo, i) => {
    const s = logoSprite(logo, 0.5);
    s.userData = { a: (i / STACK.ai.length) * Math.PI * 2 + 0.5, r: 1.25 };
    g.add(s);
    return s;
  });
  g.userData = { core, rings, docs, logos };
  return g;
}

// 03 · DevOps: the 11 Technozor services as glowing containers, plus ops logos.
function opsZone() {
  const g = new THREE.Group();
  g.position.z = ZONE_Z.ops;
  const names = ['web-app-1', 'web-app-2', 'api', 'ai-service', 'mysql', 'redis', 'qdrant', 'ollama', 'rustfs', 'livekit', 'nginx'];
  const boxes = names.map((name, i) => {
    const { tex } = canvasTexture(320, 176, (c, w, h) => {
      c.fillStyle = '#0b141b'; c.fillRect(0, 0, w, h);
      c.strokeStyle = i % 3 === 0 ? '#f2b35b' : '#2496ed'; c.lineWidth = 4; c.strokeRect(2, 2, w - 4, h - 4);
      c.font = `600 30px ${FONT_MONO}`; c.fillStyle = '#eef4f7'; c.fillText(name, 22, 70);
      c.fillStyle = '#27c93f'; c.beginPath(); c.arc(30, 122, 8, 0, Math.PI * 2); c.fill();
      c.font = `22px ${FONT_MONO}`; c.fillStyle = '#8fa4b0'; c.fillText('running', 48, 130);
    });
    const face = new THREE.MeshBasicMaterial({ map: tex, toneMapped: false });
    const side = new THREE.MeshStandardMaterial({ color: 0x0e1a24, emissive: 0x0b2a3a, roughness: 0.4, metalness: 0.5 });
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.43, 0.43), [side, side, side, side, face, side]);
    const col = i % 4, row = Math.floor(i / 4);
    box.position.set(-1.25 + col * 0.84, 0.3 + row * 0.5, 0);
    box.userData.baseY = box.position.y;
    g.add(box);
    return box;
  });
  const logos = STACK.ops.map((logo, i) => {
    const s = logoSprite(logo, 0.42);
    s.userData = { a: (i / STACK.ops.length) * Math.PI * 2, r: 2.3 };
    g.add(s);
    return s;
  });
  g.userData = { boxes, logos };
  return g;
}

// Projects as holographic screens. Projects with real captures (public/images/projects)
// cycle through them inside a browser frame; the others show a generated summary card.
export const PROJECTS = [
  { id: 'legaltech', title: 'LegalTech', tag: 'Technozor · 2026', url: 'LegalTech · multi-school legal training', stats: ['50 REST controllers', '11 containers', 'RAG < 2 s'], logos: ['Spring Boot', 'Angular', 'FastAPI', 'Docker'], shots: ['legaltech-1', 'legaltech-2', 'legaltech-4', 'legaltech-5', 'legaltech-7', 'legaltech-8'] },
  { id: 'charikty', title: 'Charikty.tn ERP', tag: 'Academic · 2025-26', url: 'charikty.tn/app', stats: ['4 business modules', 'CI/CD → AKS', '−40 % deploy time'], logos: ['NestJS', 'React', 'PostgreSQL', 'Kubernetes'], shots: ['charikty-1', 'charikty-2', 'charikty-3', 'charikty-4'] },
  { id: 'clevory', title: 'TED University portal', tag: 'Clevory · 2025', stats: ['40 teachers daily', 'REST on Odoo 14', '3 months'], logos: ['Odoo', 'Python', 'Angular', 'PostgreSQL'], shots: [] },
  { id: 'eventopia', title: 'Eventopia', tag: 'Academic · 2024-25', url: 'Eventopia · JavaFX', stats: ['desktop + web', '4 modules', 'admin dashboard'], logos: ['Java', 'MySQL'], shots: ['eventopia-1', 'eventopia-2', 'eventopia-3', 'eventopia-4'] },
];

function drawSummary(g, w, h, p, allLogos) {
  const grad = g.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, '#0d1822'); grad.addColorStop(1, '#091017');
  g.fillStyle = grad; g.fillRect(0, 0, w, h);
  g.strokeStyle = 'rgba(127,216,232,0.5)'; g.lineWidth = 4; g.strokeRect(2, 2, w - 4, h - 4);
  g.font = `500 26px ${FONT_MONO}`; g.fillStyle = '#f2b35b'; g.fillText(p.tag.toUpperCase(), 56, 84);
  g.font = `800 72px ${FONT_DISPLAY}`; g.fillStyle = '#eef4f7'; g.fillText(p.title, 56, 180);
  g.font = `30px ${FONT_BODY}`;
  p.stats.forEach((s, i) => { g.fillStyle = '#7fd8e8'; g.fillRect(56, 258 + i * 58, 10, 10); g.fillStyle = '#c9d6dd'; g.fillText(s, 84, 270 + i * 58); });
  drawMarks(g, p, allLogos, 56, 470, 64);
}

function drawMarks(g, p, allLogos, x0, y, size) {
  const marks = p.logos.map((l) => allLogos.find((x) => x.label === l)).filter(Boolean);
  marks.forEach((m, i) => {
    const s = size / 24;
    g.save(); g.translate(x0 + i * (size + 26), y); g.scale(s, s); g.fillStyle = m.color; g.fill(new Path2D(m.path)); g.restore();
  });
}

// Browser chrome + capture + caption strip, all in the portfolio's palette.
function drawShot(g, w, h, p, img, index, allLogos) {
  g.fillStyle = '#0a1219'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#121c26'; g.fillRect(0, 0, w, 44);
  ['#ff5f56', '#ffbd2e', '#27c93f'].forEach((c, i) => { g.fillStyle = c; g.beginPath(); g.arc(24 + i * 22, 22, 6.5, 0, Math.PI * 2); g.fill(); });
  g.fillStyle = '#0a1219'; g.fillRect(100, 10, w - 200, 24);
  g.font = `16px ${FONT_MONO}`; g.fillStyle = '#7f95a3'; g.fillText(p.url || p.title, 116, 28);
  const top = 44, bottom = 84, area = h - top - bottom;
  const r = Math.min(w / img.width, area / img.height);
  const dw = img.width * r, dh = img.height * r;
  g.fillStyle = '#ffffff'; g.fillRect(0, top, w, area);
  g.drawImage(img, (w - dw) / 2, top + (area - dh) / 2, dw, dh);
  const grad = g.createLinearGradient(0, h - bottom, 0, h);
  grad.addColorStop(0, '#0d1822'); grad.addColorStop(1, '#091017');
  g.fillStyle = grad; g.fillRect(0, h - bottom, w, bottom);
  g.font = `800 34px ${FONT_DISPLAY}`; g.fillStyle = '#eef4f7'; g.fillText(p.title, 26, h - 32);
  g.font = `500 18px ${FONT_MONO}`; g.fillStyle = '#f2b35b';
  g.fillText(`${String(index + 1).padStart(2, '0')} / ${String(p.shots.length).padStart(2, '0')}`, w - 108, h - 36);
  drawMarks(g, p, allLogos, w - 330, h - 64, 30);
  g.strokeStyle = 'rgba(127,216,232,0.6)'; g.lineWidth = 4; g.strokeRect(2, 2, w - 4, h - 4);
}

function projectScreen(p, allLogos) {
  const { tex, ctx, canvas } = canvasTexture(1024, 680, (g, w, h) => drawSummary(g, w, h, p, allLogos));
  const images = [];
  let index = 0;
  p.shots.forEach((name, i) => {
    const img = new Image();
    img.onload = () => {
      images[i] = img;
      if (i === 0) { drawShot(ctx, canvas.width, canvas.height, p, img, 0, allLogos); tex.needsUpdate = true; }
    };
    img.src = `${import.meta.env.BASE_URL}images/projects/${name}.jpg`;
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1.92, 1.275), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false, transparent: true, side: THREE.DoubleSide }));
  mesh.userData.next = () => {
    if (!p.shots.length) return;
    index = (index + 1) % p.shots.length;
    const img = images[index];
    if (!img) return;
    drawShot(ctx, canvas.width, canvas.height, p, img, index, allLogos);
    tex.needsUpdate = true;
  };
  return mesh;
}

function workZone(allLogos) {
  const g = new THREE.Group();
  g.position.z = ZONE_Z.work;
  const screens = PROJECTS.map((p, i) => {
    const s = projectScreen(p, allLogos);
    const a = -0.55 + i * 0.37;
    s.position.set(Math.sin(a) * 3.1 + 2.3, 1.3 + (i % 2) * 0.25 - 0.1, -Math.cos(a) * 3.1 + 3.1);
    s.lookAt(1.5, s.position.y, 4.4);
    s.userData.float = i;
    g.add(s);
    return s;
  });
  g.userData = { screens };
  return g;
}

function aboutZone() {
  const g = new THREE.Group();
  g.position.z = ZONE_Z.about;
  const { tex, ctx } = canvasTexture(512, 512, (c) => { c.fillStyle = '#0b141b'; c.beginPath(); c.arc(256, 256, 250, 0, Math.PI * 2); c.fill(); });
  const img = new Image();
  img.onload = () => {
    ctx.save(); ctx.beginPath(); ctx.arc(256, 256, 244, 0, Math.PI * 2); ctx.clip();
    const r = Math.max(512 / img.width, 512 / img.height);
    ctx.drawImage(img, (512 - img.width * r) / 2, (512 - img.height * r) / 2, img.width * r, img.height * r);
    ctx.restore(); tex.needsUpdate = true;
  };
  img.src = `${import.meta.env.BASE_URL}images/photo.jpg`;
  const photo = new THREE.Mesh(new THREE.CircleGeometry(0.85, 64), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
  photo.position.set(1.2, 1.35, 0);
  const halo = new THREE.Mesh(new THREE.TorusGeometry(0.93, 0.012, 8, 128), new THREE.MeshBasicMaterial({ color: 0xf2b35b }));
  halo.position.copy(photo.position);
  const halo2 = new THREE.Mesh(new THREE.TorusGeometry(1.04, 0.005, 8, 128), new THREE.MeshBasicMaterial({ color: 0x7fd8e8, transparent: true, opacity: 0.6 }));
  halo2.position.copy(photo.position);
  g.add(photo, halo, halo2);
  g.userData = { halo, halo2 };
  return g;
}

function contactZone() {
  const g = new THREE.Group();
  g.position.z = ZONE_Z.contact;
  const portal = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.03, 16, 200), new THREE.MeshBasicMaterial({ color: 0xf2b35b }));
  portal.position.y = 1.3;
  const portal2 = new THREE.Mesh(new THREE.TorusGeometry(1.62, 0.008, 8, 200), new THREE.MeshBasicMaterial({ color: 0x7fd8e8 }));
  portal2.position.y = 1.3;
  g.add(portal, portal2);
  g.userData = { portal, portal2 };
  return g;
}

export function createZones(allLogos) {
  const dev = devZone();
  const ai = aiZone();
  const ops = opsZone();
  const work = workZone(allLogos);
  const about = aboutZone();
  const contact = contactZone();
  const group = new THREE.Group();
  group.add(dev, ai, ops, work, about, contact);

  function orbit(list, t, speed, y, tilt = 0.25) {
    list.forEach((o, i) => {
      const a = o.userData.a + t * speed;
      o.position.set(Math.cos(a) * o.userData.r, (o.userData.y ?? y) + Math.sin(a * 2 + i) * tilt * 0.4, Math.sin(a) * o.userData.r);
    });
  }

  return {
    group,
    update(t, reduceMotion, camZ = 0, compact = false) {
      const tt = reduceMotion ? 0 : t;
      // Only draw the chapters near the camera; on phones the project screens
      // would sit behind the cards, so they stay hidden there.
      [dev, ai, ops, work, about, contact].forEach((zone) => { zone.visible = Math.abs(zone.position.z - camZ) < 12.5; });
      if (compact) work.visible = false;
      dev.children.forEach((c) => { if (c.userData.float !== undefined) c.position.y += Math.sin(tt * 0.8 + c.userData.float) * 0.0015; });
      orbit(dev.userData.logos, tt, 0.25, 1.3);
      ai.userData.core.rotation.set(tt * 0.2, tt * 0.35, 0);
      ai.userData.rings.forEach((r, i) => { r.rotation.z = tt * (0.15 + i * 0.07); });
      orbit(ai.userData.docs, tt, 0.18, 1.3);
      ai.userData.docs.forEach((d) => d.lookAt(0, d.position.y, 4));
      orbit(ai.userData.logos, tt, -0.3, 1.3);
      ops.userData.boxes.forEach((b, i) => { b.position.y = b.userData.baseY + Math.sin(tt * 1.4 + i) * 0.03; });
      orbit(ops.userData.logos, tt, 0.12, 1.0);
      work.userData.screens.forEach((s) => { s.position.y += Math.sin(tt * 0.7 + s.userData.float) * 0.001; });
      // Cycle the captures every 3 seconds, screens offset from each other.
      const step = Math.floor(t / 3);
      if (step !== work.userData.step) {
        work.userData.step = step;
        work.userData.screens[step % work.userData.screens.length].userData.next();
        work.userData.screens[(step + 2) % work.userData.screens.length].userData.next();
      }
      about.userData.halo.rotation.z = tt * 0.3;
      about.userData.halo2.rotation.y = tt * 0.4;
      contact.userData.portal.rotation.z = tt * 0.2;
      contact.userData.portal2.rotation.y = tt * 0.25;
    },
  };
}
