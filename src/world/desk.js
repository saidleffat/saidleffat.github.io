import * as THREE from 'three';
import { canvasTexture, drawCodeLine, FONT_MONO } from './textures.js';

// Night studio modelled on the profile photo: dark wall, warm shelf lights,
// a hanging plant, a mountain poster, and a desk with two monitors.

const CODE = [
  '@RestController',
  '@RequestMapping("/api/courses")',
  'public class CourseController {',
  '  private final CourseService service;',
  '',
  '  @GetMapping("/{id}")',
  '  public CourseDto get(@PathVariable Long id) {',
  '    return service.findById(id);',
  '  }',
  '}',
  '',
  '# ai-service/rag.py',
  'docs = retriever.invoke(question)',
  'answer = llm.invoke(prompt.format(context=docs))',
  'return {"answer": answer, "sources": cite(docs)}',
];

const LOGS = [
  'api         | Started Application in 4.2s',
  'ai-service  | Uvicorn running on :8000',
  'qdrant      | collection ready (384 dims)',
  'nginx       | GET /api/courses 200 12ms',
  'ai-service  | POST /ask 200 1.6s',
  'redis       | Ready to accept connections',
  'web-app-1   | compiled successfully',
  'livekit     | room created',
  'mysql       | ready for connections',
  'ollama      | model loaded',
];

const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.75, ...extra });
const shadow = (m) => { m.castShadow = true; m.receiveShadow = true; return m; };

export function createDesk({ reduceMotion }) {
  const group = new THREE.Group();

  // Room
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), mat(0x0b0f14, { roughness: 0.55, metalness: 0.2 }));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(14, 6), mat(0x111821, { roughness: 0.95 }));
  wall.position.set(0, 3, -1.25);
  wall.receiveShadow = true;
  group.add(floor, wall);

  // Shelves with warm light strips (left), like the photo background.
  for (let i = 0; i < 3; i++) {
    const y = 1.25 + i * 0.55;
    const board = shadow(new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.04, 0.28), mat(0x2a2118)));
    board.position.set(-1.75, y, -1.1);
    const strip = new THREE.Mesh(new THREE.BoxGeometry(1.06, 0.012, 0.02), new THREE.MeshBasicMaterial({ color: 0xffb35c }));
    strip.position.set(-1.75, y - 0.03, -0.98);
    group.add(board, strip);
    for (let b = 0; b < 5 + i; b++) {
      const h = 0.16 + ((b * 37) % 7) * 0.02;
      const book = shadow(new THREE.Mesh(new THREE.BoxGeometry(0.05, h, 0.2), mat([0x3a3027, 0x56473a, 0x2d2a26, 0x6b5a48][b % 4])));
      book.position.set(-2.2 + b * 0.075, y + 0.02 + h / 2, -1.12);
      group.add(book);
    }
  }
  const shelfLight = new THREE.PointLight(0xffa64d, 5, 3.6, 2);
  shelfLight.position.set(-1.75, 1.9, -0.8);
  group.add(shelfLight);

  // Hanging plant over the shelves.
  const pot = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.085, 0.16, 20), mat(0x1c1c1c)));
  pot.position.set(-1.45, 2.44, -1.1);
  group.add(pot);
  const leafMat = mat(0x2f5a2c, { roughness: 0.6 });
  for (let i = 0; i < 26; i++) {
    const leaf = shadow(new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), leafMat));
    const strand = i % 4;
    leaf.scale.set(1, 0.45, 1.4);
    leaf.position.set(-1.6 + strand * 0.09 + Math.sin(i) * 0.03, 2.4 - (i % 7) * 0.13, -1.05 + Math.cos(i * 1.7) * 0.06);
    leaf.rotation.set(Math.sin(i) * 0.6, i, Math.cos(i) * 0.5);
    group.add(leaf);
  }

  // Mountain poster (right).
  const poster = canvasTexture(400, 520, (g, w, h) => {
    const grad = g.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#9aa3ab'); grad.addColorStop(1, '#3c4248');
    g.fillStyle = grad; g.fillRect(0, 0, w, h);
    g.fillStyle = '#2a2f34';
    g.beginPath(); g.moveTo(0, h); g.lineTo(80, 300); g.lineTo(150, 360); g.lineTo(240, 210); g.lineTo(320, 320); g.lineTo(w, 260); g.lineTo(w, h); g.fill();
    g.fillStyle = '#e8ecef';
    g.beginPath(); g.moveTo(240, 210); g.lineTo(205, 262); g.lineTo(228, 255); g.lineTo(245, 270); g.lineTo(262, 250); g.lineTo(280, 262); g.fill();
  });
  const frame = shadow(new THREE.Mesh(new THREE.BoxGeometry(0.86, 1.1, 0.03), mat(0x0c0c0c)));
  frame.position.set(1.85, 1.95, -1.22);
  const art = new THREE.Mesh(new THREE.PlaneGeometry(0.78, 1.0), new THREE.MeshStandardMaterial({ map: poster.tex, roughness: 0.9 }));
  art.position.set(1.85, 1.95, -1.2);
  group.add(frame, art);

  // Desk
  const top = shadow(new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.05, 0.75), mat(0x1d1712, { roughness: 0.6 })));
  top.position.set(0, 0.75, -0.12);
  group.add(top);
  [[-0.85, -0.44], [0.85, -0.44], [-0.85, 0.2], [0.85, 0.2]].forEach(([x, z]) => {
    const leg = shadow(new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.75, 0.04), mat(0x0c0d0f, { metalness: 0.6 })));
    leg.position.set(x, 0.375, z);
    group.add(leg);
  });

  // Main monitor with live code.
  const code = canvasTexture(1024, 600, () => {});
  const codeState = { chars: 0, last: 0 };
  const screenMat = new THREE.MeshBasicMaterial({ map: code.tex, toneMapped: false });
  const bezel = mat(0x0a0b0d, { metalness: 0.5, roughness: 0.4 });
  const monitor = shadow(new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.54, 0.03), [bezel, bezel, bezel, bezel, screenMat, bezel]));
  monitor.position.set(-0.05, 1.18, -0.3);
  const stand = shadow(new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.32, 0.04), bezel));
  stand.position.set(-0.05, 0.92, -0.33);
  const foot = shadow(new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.015, 0.18), bezel));
  foot.position.set(-0.05, 0.78, -0.3);
  group.add(monitor, stand, foot);

  // Side monitor in portrait orientation with container logs.
  const logs = canvasTexture(480, 820, () => {});
  const logMat = new THREE.MeshBasicMaterial({ map: logs.tex, toneMapped: false });
  const side = shadow(new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.58, 0.03), [bezel, bezel, bezel, bezel, logMat, bezel]));
  side.position.set(0.68, 1.2, -0.22);
  side.rotation.y = -0.45;
  group.add(side);

  const screenLight = new THREE.PointLight(0x6fd6ff, 4.5, 4, 2);
  screenLight.position.set(0, 1.2, 0.05);
  group.add(screenLight);

  // Keyboard with keys that light up while typing.
  const kb = shadow(new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.02, 0.15), mat(0x111317)));
  kb.position.set(-0.05, 0.785, 0.06);
  group.add(kb);
  const keyCount = 14 * 4;
  const keys = new THREE.InstancedMesh(new THREE.BoxGeometry(0.024, 0.01, 0.024), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 }), keyCount);
  const tmp = new THREE.Object3D();
  const baseKey = new THREE.Color(0x23272d);
  for (let i = 0; i < keyCount; i++) {
    tmp.position.set(-0.05 - 0.195 + (i % 14) * 0.03, 0.8, 0.06 - 0.045 + Math.floor(i / 14) * 0.03);
    tmp.updateMatrix();
    keys.setMatrixAt(i, tmp.matrix);
    keys.setColorAt(i, baseKey);
  }
  group.add(keys);
  const keyHeat = new Float32Array(keyCount);
  const hot = new THREE.Color(0x7fd8e8);
  const col = new THREE.Color();

  // Desk lamp (warm key light).
  const lampArm = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.5, 8), bezel));
  lampArm.position.set(-0.72, 1.0, -0.3);
  lampArm.rotation.z = 0.35;
  const lampHead = shadow(new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.12, 20, 1, true), mat(0x0c0c0c, { side: THREE.DoubleSide })));
  lampHead.position.set(-0.62, 1.24, -0.22);
  lampHead.rotation.z = -0.9;
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.025, 12, 8), new THREE.MeshBasicMaterial({ color: 0xffd08a }));
  bulb.position.set(-0.6, 1.2, -0.2);
  const lamp = new THREE.SpotLight(0xffb469, 16, 5, 0.95, 0.6, 2);
  lamp.position.copy(bulb.position);
  lamp.target.position.set(-0.1, 0.75, 0.1);
  lamp.castShadow = true;
  lamp.shadow.mapSize.set(1024, 1024);
  lamp.shadow.bias = -0.0005;
  group.add(lampArm, lampHead, bulb, lamp, lamp.target);

  // Mug
  const mug = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.036, 0.09, 20), mat(0xd9d4cc)));
  mug.position.set(0.42, 0.82, 0.08);
  group.add(mug);

  // Office chair
  const chair = new THREE.Group();
  const seat = shadow(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, 0.48), mat(0x15181c)));
  seat.position.y = 0.48;
  const back = shadow(new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.62, 0.06), mat(0x15181c)));
  back.position.set(0, 0.86, 0.26);
  back.rotation.x = -0.12;
  const pole = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.38, 10), mat(0x0c0d0f, { metalness: 0.7 })));
  pole.position.y = 0.26;
  chair.add(seat, back, pole);
  for (let i = 0; i < 5; i++) {
    const legC = shadow(new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.03, 0.3), mat(0x0c0d0f, { metalness: 0.7 })));
    legC.position.set(Math.sin((i / 5) * Math.PI * 2) * 0.15, 0.05, Math.cos((i / 5) * Math.PI * 2) * 0.15);
    legC.rotation.y = (i / 5) * Math.PI * 2;
    chair.add(legC);
  }
  chair.position.set(-0.05, 0, 0.62);
  group.add(chair);

  // Seated coder, lit from behind by the screens.
  const coder = createCoder();
  coder.group.position.set(-0.05, 0, 0.62);
  group.add(coder.group);

  function drawCode(t) {
    const g = code.ctx;
    g.fillStyle = '#0a1016';
    g.fillRect(0, 0, 1024, 600);
    g.fillStyle = '#141d26';
    g.fillRect(0, 0, 1024, 34);
    ['#ff5f56', '#ffbd2e', '#27c93f'].forEach((c, i) => { g.fillStyle = c; g.beginPath(); g.arc(22 + i * 22, 17, 6, 0, Math.PI * 2); g.fill(); });
    g.font = `22px ${FONT_MONO}`;
    g.fillStyle = '#5d7180';
    g.fillText('CourseController.java  ·  rag.py', 100, 24);
    g.font = `24px ${FONT_MONO}`;
    let left = codeState.chars;
    let lastY = 70;
    let lastX = 60;
    for (let i = 0; i < CODE.length && left > 0; i++) {
      const visible = CODE[i].slice(0, left);
      left -= CODE[i].length + 1;
      const y = 70 + i * 34;
      g.fillStyle = '#3b4a56';
      g.fillText(String(i + 1).padStart(2, ' '), 14, y);
      drawCodeLine(g, visible, 60, y);
      lastY = y;
      lastX = 60 + g.measureText(visible).width;
    }
    if (Math.floor(t * 2) % 2 === 0) { g.fillStyle = '#7fd8e8'; g.fillRect(lastX + 2, lastY - 22, 12, 28); }
    code.tex.needsUpdate = true;
  }

  function drawLogs(t) {
    const g = logs.ctx;
    g.fillStyle = '#081016';
    g.fillRect(0, 0, 480, 820);
    g.font = `20px ${FONT_MONO}`;
    g.fillStyle = '#27c93f';
    g.fillText('$ docker compose logs -f', 18, 36);
    const offset = Math.floor(t * 1.2);
    for (let i = 0; i < 22; i++) {
      const line = LOGS[(i + offset) % LOGS.length];
      const [svc, msg] = line.split('|');
      const y = 76 + i * 33;
      g.fillStyle = '#f2b35b'; g.fillText(svc, 18, y);
      g.fillStyle = '#9fb3c0'; g.fillText('|' + msg, 18 + g.measureText(svc).width, y);
    }
    logs.tex.needsUpdate = true;
  }

  const total = CODE.join('\n').length;
  drawCode(0);
  drawLogs(0);
  let lastLog = -1;

  return {
    group,
    coder,
    focus: monitor.position.clone(),
    update(t, dt, active) {
      if (!active) return;
      if (!reduceMotion || codeState.chars === 0) {
        codeState.last += dt;
        if (codeState.last > 0.045) {
          codeState.last = 0;
          codeState.chars = codeState.chars > total + 60 ? 0 : codeState.chars + (reduceMotion ? total : 2);
          drawCode(t);
          const k = Math.floor(Math.random() * keyCount);
          keyHeat[k] = 1;
        }
      }
      const step = Math.floor(t * 1.2);
      if (step !== lastLog) { lastLog = step; drawLogs(t); }
      for (let i = 0; i < keyCount; i++) {
        if (keyHeat[i] > 0) {
          keyHeat[i] = Math.max(0, keyHeat[i] - dt * 4);
          keys.setColorAt(i, col.copy(baseKey).lerp(hot, keyHeat[i]));
        }
      }
      keys.instanceColor.needsUpdate = true;
      coder.update(t, reduceMotion);
    },
  };
}

// Procedural seated figure: black blazer, curly hair, hands on the keyboard.
function createCoder() {
  const group = new THREE.Group();
  const blazer = mat(0x15181c, { roughness: 0.85 });
  const skin = mat(0xa8765c, { roughness: 0.7 });
  const hairMat = mat(0x22170f, { roughness: 1, flatShading: true });
  const jeans = mat(0x111215, { roughness: 0.9 });

  function limb(radius, material) {
    const mesh = shadow(new THREE.Mesh(new THREE.CapsuleGeometry(radius, 1, 6, 12), material));
    group.add(mesh);
    return mesh;
  }
  const up = new THREE.Vector3(0, 1, 0);
  function place(mesh, a, b, radius) {
    const dir = new THREE.Vector3().subVectors(b, a);
    const len = dir.length();
    mesh.position.copy(a).addScaledVector(dir, 0.5);
    mesh.quaternion.setFromUnitVectors(up, dir.normalize());
    mesh.scale.set(1, Math.max(0.01, (len - radius * 2) / 1 + 0.0001), 1);
    mesh.scale.y = Math.max(0.01, len - radius * 2);
  }

  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  // Legs (seated)
  const thighs = [limb(0.075, jeans), limb(0.075, jeans)];
  const shins = [limb(0.065, jeans), limb(0.065, jeans)];
  [-1, 1].forEach((s, i) => {
    place(thighs[i], V(s * 0.1, 0.56, 0.05), V(s * 0.11, 0.56, -0.36), 0.075);
    place(shins[i], V(s * 0.11, 0.56, -0.38), V(s * 0.12, 0.08, -0.42), 0.065);
    const shoe = shadow(new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.07, 0.22), mat(0xe9e9e6)));
    shoe.position.set(s * 0.12, 0.035, -0.48);
    group.add(shoe);
  });
  // Torso leaning toward the screen
  const torso = shadow(new THREE.Mesh(new THREE.CapsuleGeometry(0.17, 0.32, 8, 16), blazer));
  torso.position.set(0, 0.86, -0.02);
  torso.rotation.x = -0.28;
  torso.scale.set(1.15, 1, 0.8);
  group.add(torso);
  const neck = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.055, 0.1, 12), skin));
  neck.position.set(0, 1.12, -0.1);
  group.add(neck);
  const head = new THREE.Group();
  const skull = shadow(new THREE.Mesh(new THREE.SphereGeometry(0.115, 24, 16), skin));
  skull.scale.set(0.95, 1.08, 1);
  head.add(skull);
  for (let i = 0; i < 34; i++) {
    const curl = shadow(new THREE.Mesh(new THREE.IcosahedronGeometry(0.038, 0), hairMat));
    const a = (i / 34) * Math.PI * 2 * 3.1;
    const r = 0.1 + (i % 3) * 0.006;
    const phi = 0.25 + (i % 5) * 0.16;
    curl.position.set(Math.cos(a) * Math.sin(phi) * r, 0.05 + Math.cos(phi) * r * 0.9, Math.sin(a) * Math.sin(phi) * r + 0.01);
    head.add(curl);
  }
  const beard = shadow(new THREE.Mesh(new THREE.SphereGeometry(0.112, 24, 12, Math.PI * 1.05, Math.PI * 0.9, Math.PI * 0.6, Math.PI * 0.28), hairMat));
  head.add(beard);
  head.position.set(0, 1.26, -0.14);
  head.rotation.x = 0.15;
  group.add(head);

  // Arms: shoulder -> elbow -> hand on keyboard
  const upper = [limb(0.055, blazer), limb(0.055, blazer)];
  const fore = [limb(0.045, blazer), limb(0.045, blazer)];
  const hands = [-1, 1].map(() => {
    const h = shadow(new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 8), skin));
    h.scale.set(1.1, 0.6, 1.4);
    group.add(h);
    return h;
  });
  const shoulder = [V(-0.2, 1.03, -0.06), V(0.2, 1.03, -0.06)];
  const elbow = [V(-0.25, 0.83, -0.28), V(0.25, 0.83, -0.28)];

  return {
    group,
    update(t, reduceMotion) {
      [0, 1].forEach((i) => {
        const s = i === 0 ? -1 : 1;
        const tap = reduceMotion ? 0 : Math.max(0, Math.sin(t * 13 + i * 2.1)) * 0.012;
        const drift = reduceMotion ? 0 : Math.sin(t * 2.3 + i) * 0.015;
        const hand = V(s * 0.12 + drift, 0.81 + tap, -0.55);
        place(upper[i], shoulder[i], elbow[i], 0.055);
        place(fore[i], elbow[i], hand, 0.045);
        hands[i].position.copy(hand);
      });
      if (!reduceMotion) {
        head.rotation.y = Math.sin(t * 0.4) * 0.08;
        head.rotation.x = 0.15 + Math.sin(t * 0.9) * 0.02;
      }
    },
  };
}
