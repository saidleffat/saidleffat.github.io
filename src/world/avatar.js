import * as THREE from 'three';

// Voxel avatar in the spirit of block games, drawn after the real person:
// short curly dark hair, full beard, thick brows, black blazer over a dark tee,
// indigo jeans and white sneakers. Every face is a tiny pixel-art canvas.
// Limbs have two segments so the pose rig can bend elbows and knees.

const C = {
  skin: '#c58d68', skinShade: '#a9744f', skinDark: '#94623f',
  hair: '#2a1a11', hairHi: '#47301f', hairLo: '#1b100a',
  beard: '#2d1d13', stubble: '#5b3f2b',
  brow: '#1e120b', eyeWhite: '#f2ede6', iris: '#3a2213', lip: '#b26f63',
  blazer: '#252b33', blazerHi: '#333a44', blazerLo: '#1a1f25',
  tee: '#3a4049', pin: '#f2b35b',
  jeans: '#30476b', jeansLo: '#25395a', jeansHi: '#3b5580',
  shoe: '#efefea', shoeLo: '#cfcfc8', sole: '#f2b35b',
};

// Deterministic "random" so the hair and stubble look the same on every load.
const rand = (x, y, s = 1) => {
  const n = Math.sin(x * 127.1 + y * 311.7 + s * 74.7) * 43758.5453;
  return n - Math.floor(n);
};

function pixels(w, h, paint) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  const put = (x, y, color) => { g.fillStyle = color; g.fillRect(x, y, 1, 1); };
  const rect = (x, y, rw, rh, color) => { g.fillStyle = color; g.fillRect(x, y, rw, rh); };
  paint({ put, rect, w, h });
  const tex = new THREE.CanvasTexture(c);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const curly = (put, x, y) => {
  const r = rand(x, y);
  put(x, y, r > 0.72 ? C.hairHi : r < 0.18 ? C.hairLo : C.hair);
};
const stubble = (put, x, y) => put(x, y, rand(x, y, 3) > 0.7 ? C.stubble : C.beard);

// Head: 16 x 16 per face.
function headTextures() {
  const front = pixels(16, 16, ({ put, rect }) => {
    rect(0, 0, 16, 16, C.skin);
    for (let y = 0; y < 4; y++) for (let x = 0; x < 16; x++) curly(put, x, y);
    for (let x = 0; x < 16; x++) if (x < 2 || x > 13 || rand(x, 4) > 0.55) curly(put, x, 4);
    for (let y = 5; y < 10; y++) { curly(put, 0, y); curly(put, 15, y); }
    rect(3, 5, 4, 1, C.brow); rect(9, 5, 4, 1, C.brow);
    put(2, 5, C.hairLo); put(13, 5, C.hairLo);
    rect(3, 7, 4, 1, C.eyeWhite); rect(9, 7, 4, 1, C.eyeWhite);
    rect(4, 7, 2, 1, C.iris); rect(10, 7, 2, 1, C.iris);
    rect(3, 6, 4, 1, C.skinShade); rect(9, 6, 4, 1, C.skinShade);
    rect(7, 7, 2, 3, C.skinShade); put(7, 9, C.skinDark); put(8, 9, C.skinDark);
    for (let x = 4; x < 12; x++) stubble(put, x, 10);
    for (let y = 10; y < 16; y++) {
      const inset = Math.max(0, y - 12);
      for (let x = 1 + inset; x < 15 - inset; x++) if (y > 10 || x < 4 || x > 11) stubble(put, x, y);
    }
    rect(6, 11, 4, 1, C.lip);
    put(6, 12, C.beard); put(9, 12, C.beard);
  });
  const side = (frontOnLeft) => pixels(16, 16, ({ put, rect }) => {
    rect(0, 0, 16, 16, C.skin);
    for (let y = 0; y < 7; y++) for (let x = 0; x < 16; x++) curly(put, x, y);
    for (let y = 7; y < 12; y++) for (let x = 0; x < 16; x++) {
      const fromFront = frontOnLeft ? x : 15 - x;
      if (fromFront > 9) curly(put, x, y);
    }
    const ear = frontOnLeft ? 7 : 6;
    rect(ear, 7, 3, 3, C.skinShade); put(ear + 1, 8, C.skinDark);
    for (let y = 9; y < 16; y++) for (let x = 0; x < 16; x++) {
      const fromFront = frontOnLeft ? x : 15 - x;
      if (fromFront < 6 - Math.max(0, y - 12)) stubble(put, x, y);
    }
  });
  const back = pixels(16, 16, ({ put, rect }) => {
    rect(0, 0, 16, 16, C.skinShade);
    for (let y = 0; y < 13; y++) for (let x = 0; x < 16; x++) curly(put, x, y);
    for (let x = 0; x < 16; x++) if (rand(x, 13) > 0.5) curly(put, x, 13);
  });
  const top = pixels(16, 16, ({ put }) => { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) curly(put, x, y); });
  const bottom = pixels(16, 16, ({ put, rect }) => {
    rect(0, 0, 16, 16, C.skinShade);
    for (let y = 0; y < 9; y++) for (let x = 2; x < 14; x++) stubble(put, x, y);
  });
  // BoxGeometry face order: +x, -x, +y, -y, +z (front), -z (back).
  return [side(true), side(false), top, bottom, front, back];
}

function torsoTextures() {
  const blazerFill = ({ rect, put, w, h }) => {
    rect(0, 0, w, h, C.blazer);
    for (let y = 0; y < h; y++) { put(0, y, C.blazerLo); put(w - 1, y, C.blazerLo); }
  };
  const front = pixels(16, 24, (p) => {
    blazerFill(p);
    const { rect, put } = p;
    // V neck showing the tee, lapels on both sides.
    for (let y = 0; y < 13; y++) {
      const half = Math.max(0, 3 - Math.floor(y / 4));
      rect(8 - half - 1, y, (half + 1) * 2, 1, C.tee);
      put(8 - half - 2, y, C.blazerHi); put(8 + half + 1, y, C.blazerHi);
    }
    rect(3, 6, 2, 2, C.pin);              // small amber pin on the lapel
    put(7, 15, C.blazerHi); put(7, 18, C.blazerHi); // buttons
    rect(2, 17, 4, 1, C.blazerLo); rect(10, 17, 4, 1, C.blazerLo); // pockets
    rect(0, 22, 16, 2, C.blazerLo);
  });
  const back = pixels(16, 24, (p) => { blazerFill(p); p.rect(7, 4, 2, 20, C.blazerLo); });
  const side = pixels(8, 24, (p) => blazerFill(p));
  const top = pixels(16, 8, (p) => { p.rect(0, 0, 16, 8, C.blazer); p.rect(6, 0, 4, 8, C.tee); });
  const bottom = pixels(16, 8, (p) => p.rect(0, 0, 16, 8, C.jeans));
  return [side, side, top, bottom, front, back];
}

function sleeve(withHand) {
  const face = pixels(8, 12, ({ rect, put }) => {
    rect(0, 0, 8, 12, C.blazer);
    put(0, 0, C.blazerHi); put(7, 0, C.blazerLo);
    if (withHand) {
      rect(0, 7, 8, 1, C.blazerLo);
      rect(0, 8, 8, 4, C.skin);
      rect(0, 11, 8, 1, C.skinShade);
    }
  });
  const end = pixels(8, 8, ({ rect }) => rect(0, 0, 8, 8, withHand ? C.skin : C.blazer));
  return [face, face, end, end, face, face];
}

function trouser(withShoe) {
  const face = (front) => pixels(8, 12, ({ rect, put }) => {
    rect(0, 0, 8, 12, C.jeans);
    for (let y = 0; y < 12; y++) put(front ? 7 : 0, y, C.jeansLo);
    if (!withShoe) { put(2, 3, C.jeansHi); put(3, 4, C.jeansHi); }
    if (withShoe) {
      rect(0, 8, 8, 3, C.shoe);
      rect(0, 11, 8, 1, C.sole);
      if (front) { put(3, 8, C.shoeLo); put(4, 9, C.shoeLo); }
    }
  });
  const end = pixels(8, 8, ({ rect }) => rect(0, 0, 8, 8, withShoe ? C.sole : C.jeans));
  return [face(false), face(false), end, end, face(true), face(false)];
}

const mats = (textures) => textures.map((map) => new THREE.MeshLambertMaterial({ map }));

function block(w, h, d, textures, y = 0) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mats(textures));
  mesh.position.y = y;
  mesh.castShadow = true;
  return mesh;
}

export function createAvatar() {
  const P = 0.05; // one texel of the 8 x 8 x 8 head
  const root = new THREE.Group();
  const body = new THREE.Group();
  body.position.y = 12 * P;
  body.userData.baseY = body.position.y;
  root.add(body);

  const legs = [1, -1].map((side) => {
    const hip = new THREE.Group();
    hip.position.x = side * 2 * P;
    hip.add(block(4 * P, 6 * P, 4 * P, trouser(false), -3 * P));
    const knee = new THREE.Group();
    knee.position.y = -6 * P;
    knee.add(block(4 * P, 6 * P, 4 * P, trouser(true), -3 * P));
    hip.add(knee);
    body.add(hip);
    return { hip, knee };
  });

  const spine = new THREE.Group();
  body.add(spine);
  spine.add(block(8 * P, 12 * P, 4 * P, torsoTextures(), 6 * P));

  const arms = [1, -1].map((side) => {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * 6 * P, 11 * P, 0);
    shoulder.add(block(4 * P, 6 * P, 4 * P, sleeve(false), -2 * P));
    const elbow = new THREE.Group();
    elbow.position.y = -5 * P;
    elbow.add(block(4 * P, 6 * P, 4 * P, sleeve(true), -3 * P));
    shoulder.add(elbow);
    spine.add(shoulder);
    return { shoulder, elbow };
  });

  const neck = new THREE.Group();
  neck.position.y = 12 * P;
  spine.add(neck);
  const head = new THREE.Group();
  head.add(block(8 * P, 8 * P, 8 * P, headTextures(), 4 * P));
  neck.add(head);

  // Pixel laptop for the "type" pose.
  const laptop = new THREE.Group();
  const grey = pixels(8, 8, ({ rect }) => rect(0, 0, 8, 8, '#b9c3c8'));
  const screen = pixels(8, 6, ({ rect, put }) => {
    rect(0, 0, 8, 6, '#0b1620');
    [[1, 1, '#7fd8e8'], [2, 1, '#7fd8e8'], [4, 1, '#f2b35b'], [1, 2, '#b6e3a1'], [2, 2, '#b6e3a1'], [3, 2, '#b6e3a1'], [2, 3, '#7fd8e8'], [3, 3, '#7fd8e8'], [5, 3, '#7fd8e8'], [1, 4, '#f2b35b']].forEach(([x, y, c]) => put(x, y, c));
  });
  const base = new THREE.Mesh(new THREE.BoxGeometry(8 * P, 0.6 * P, 5 * P), new THREE.MeshLambertMaterial({ map: grey }));
  const lid = new THREE.Mesh(new THREE.BoxGeometry(8 * P, 5 * P, 0.5 * P), [grey, grey, grey, grey, grey, grey].map((map) => new THREE.MeshLambertMaterial({ map })));
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(7.2 * P, 4.4 * P), new THREE.MeshBasicMaterial({ map: screen, toneMapped: false }));
  lid.position.set(0, 2.5 * P, -2.5 * P);
  lid.rotation.x = -0.25;
  glow.position.set(0, 0, 0.26 * P);
  lid.add(glow);
  laptop.add(base, lid);
  laptop.position.set(0, 5 * P, 6.5 * P);
  spine.add(laptop);

  const joints = {
    body, spine, neck, head,
    lSh: arms[0].shoulder, lEl: arms[0].elbow, rSh: arms[1].shoulder, rEl: arms[1].elbow,
    lHip: legs[0].hip, lKnee: legs[0].knee, rHip: legs[1].hip, rKnee: legs[1].knee,
  };
  return { root, joints, laptop };
}

// Poses: joint -> [x, y, z] Euler angles. The character faces +Z (the camera);
// its left arm is on +X. Shoulder x < 0 lifts an arm forward, z lifts it sideways.
export const POSES = {
  idle:   { lSh: [0, 0, 0.08], rSh: [0, 0, -0.08], lEl: [-0.15, 0, 0], rEl: [-0.15, 0, 0] },
  wave:   { lSh: [0, 0, 0.08], lEl: [-0.15, 0, 0], rSh: [0, 0, -2.7], rEl: [0, 0, -0.4], head: [0, 0, -0.1] },
  type:   { lSh: [-0.9, 0, 0.12], rSh: [-0.9, 0, -0.12], lEl: [-0.9, 0, 0], rEl: [-0.9, 0, 0], head: [0.35, 0, 0], spine: [0.06, 0, 0] },
  think:  { rSh: [-1.2, 0, -0.3], rEl: [-2.3, 0, 0.25], lSh: [-0.45, 0, 0.35], lEl: [-1.5, 0, -0.3], head: [0.1, 0.25, 0.15] },
  thumbs: { lSh: [-0.9, 0, 0.25], lEl: [-1.6, 0, 0], rSh: [0, 0, -0.08], rEl: [-0.15, 0, 0], head: [0, 0, 0.1], spine: [0, 0.15, 0] },
  pointL: { rSh: [0, 0, -1.5], rEl: [0, 0, -0.05], lSh: [0, 0, 0.08], lEl: [-0.15, 0, 0], head: [0, -0.5, 0], spine: [0, -0.2, 0] },
  pocket: { lSh: [0.1, 0, 0.04], rSh: [0.1, 0, -0.04], lEl: [-0.6, 0, 0.1], rEl: [-0.6, 0, -0.1], head: [0, 0.2, 0] },
  cheer:  { lSh: [0, 0, 2.7], rSh: [0, 0, -2.7], lEl: [0, 0, 0.3], rEl: [0, 0, -0.3], head: [-0.15, 0, 0] },
  fall:   { body: [0.7, 0, 0], lSh: [0, 0, 2.3], rSh: [0, 0, -2.3], lEl: [0, 0, 0.5], rEl: [0, 0, -0.5], lHip: [0.5, 0, 0.15], rHip: [0.25, 0, -0.15], lKnee: [1.2, 0, 0], rKnee: [0.9, 0, 0], head: [-0.55, 0, 0] },
};
const JOINTS = ['body', 'spine', 'neck', 'head', 'lSh', 'lEl', 'rSh', 'rEl', 'lHip', 'lKnee', 'rHip', 'rKnee'];

export function applyPose(avatar, poseA, poseB, mix, fallWeight, t, reduceMotion) {
  const { joints, laptop } = avatar;
  const a = POSES[poseA] || POSES.idle;
  const b = POSES[poseB] || POSES.idle;
  const f = POSES.fall;
  const w = (name) => (poseA === name ? 1 - mix : 0) + (poseB === name ? mix : 0);
  const motion = reduceMotion ? 0 : 1;
  for (const j of JOINTS) {
    const ra = a[j] || [0, 0, 0], rb = b[j] || [0, 0, 0], rf = f[j] || [0, 0, 0];
    joints[j].rotation.set(
      THREE.MathUtils.lerp(ra[0] + (rb[0] - ra[0]) * mix, rf[0], fallWeight),
      THREE.MathUtils.lerp(ra[1] + (rb[1] - ra[1]) * mix, rf[1], fallWeight),
      THREE.MathUtils.lerp(ra[2] + (rb[2] - ra[2]) * mix, rf[2], fallWeight),
    );
  }
  const still = 1 - fallWeight;
  // Layered motion on top of the blended pose.
  joints.spine.rotation.x += Math.sin(t * 1.6) * 0.03 * motion;
  joints.head.rotation.y += Math.sin(t * 0.8) * 0.12 * motion * still;
  joints.rEl.rotation.z += Math.sin(t * 9) * 0.5 * w('wave') * still * motion;
  joints.rSh.rotation.z += Math.sin(t * 9) * 0.12 * w('wave') * still * motion;
  ['lEl', 'rEl'].forEach((k, i) => { joints[k].rotation.x += Math.sin(t * 15 + i * 1.7) * 0.12 * w('type') * still * motion; });
  joints.lEl.rotation.z += Math.sin(t * 8) * 0.4 * w('cheer') * still * motion;
  joints.rEl.rotation.z -= Math.sin(t * 8) * 0.4 * w('cheer') * still * motion;
  joints.head.rotation.z += Math.sin(t * 1.3) * 0.08 * w('think') * still * motion;
  joints.lSh.rotation.z += Math.sin(t * 13) * 0.18 * fallWeight * motion;
  joints.rSh.rotation.z -= Math.sin(t * 13 + 1) * 0.18 * fallWeight * motion;
  joints.lKnee.rotation.x += Math.sin(t * 11) * 0.25 * fallWeight * motion;
  joints.rKnee.rotation.x += Math.sin(t * 11 + 2) * 0.25 * fallWeight * motion;
  const hop = Math.abs(Math.sin(t * 5)) * 0.14 * w('cheer') * still * motion;
  joints.body.position.y = joints.body.userData.baseY + Math.sin(t * 2) * 0.012 * motion + hop;
  const lap = w('type') * still;
  laptop.visible = lap > 0.05;
  laptop.scale.setScalar(Math.max(0.0001, lap));
}
