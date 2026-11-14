import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { createDesk } from './world/desk.js';
import { createPortrait } from './world/portrait.js';
import { createAvatar, applyPose } from './world/avatar.js';
import { createZones, createStarfield, ZONE_Z } from './world/zones.js';
import { ALL } from './logos.js';

// Scroll story. Each <section data-scene="key"> maps to a camera keyframe; the camera
// starts behind the coder at the desk, dives through the monitor, then flies down a
// corridor of chapters placed along -Z (see ZONE_Z).

// Camera (c*), camera target (t*), and the cartoon avatar in camera space:
// px/py offset of its feet right/up, pd distance ahead, ps scale (0 = hidden).
const K = (cx, cy, cz, tx, ty, tz, px = 0, py = 0, pd = 4, ps = 0) => ({ cx, cy, cz, tx, ty, tz, px, py, pd, ps });
const KEYFRAMES = {
  hero:    K(1.55, 1.55, 2.25, -0.15, 1.05, -0.35),
  dive:    K(-0.05, 1.18, 0.22, -0.05, 1.18, -0.3, 0, -1.0, 2.5, 0),
  me:      K(0.0, 1.25, ZONE_Z.portrait + 5.0, -0.9, 1.25, ZONE_Z.portrait, 0.55, -1.3, 4.0, 0.72),
  dev:     K(0.3, 1.5, ZONE_Z.dev + 3.9, -1.3, 1.3, ZONE_Z.dev, 1.35, -1.25, 4.3, 0.85),
  ai:      K(-0.4, 1.7, ZONE_Z.ai + 5.6, 1.5, 1.3, ZONE_Z.ai, -1.4, -1.25, 4.3, 0.85),
  ops:     K(0.6, 2.4, ZONE_Z.ops + 5.6, -1.6, 0.8, ZONE_Z.ops, 1.45, -1.2, 4.4, 0.8),
  work:    K(0.6, 1.4, ZONE_Z.work + 5.2, -0.9, 1.3, ZONE_Z.work, 1.8, -1.35, 4.4, 0.55),
  about:   K(0.0, 1.35, ZONE_Z.about + 4.0, -0.6, 1.35, ZONE_Z.about, 1.95, -1.3, 4.4, 0.6),
  contact: K(0.0, 1.3, ZONE_Z.contact + 4.4, 0.0, 1.3, ZONE_Z.contact, 1.75, -1.3, 4.4, 0.75),
};
const KEYS = ['cx', 'cy', 'cz', 'tx', 'ty', 'tz', 'px', 'py', 'pd', 'ps'];
// What the avatar does in each chapter.
const CHAPTER_POSE = { hero: 'idle', dive: 'idle', me: 'wave', dev: 'type', ai: 'think', ops: 'thumbs', work: 'pointL', about: 'pocket', contact: 'cheer' };
const smooth = (t) => t * t * (3 - 2 * t);
const clamp01 = (v) => Math.min(1, Math.max(0, v));

export function initScene(canvas, { onReady = () => {}, onChapter = () => {}, flash } = {}) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  } catch {
    document.documentElement.classList.add('no-webgl');
    onReady();
    return;
  }
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const small = Math.min(window.innerWidth, window.innerHeight) < 700;
  const pixelRatio = Math.min(window.devicePixelRatio, small ? 1.5 : 1.75);
  renderer.setPixelRatio(pixelRatio);
  renderer.setClearColor(0x05080c, 1);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.3;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x05080c, 0.05);
  const camera = new THREE.PerspectiveCamera(40, 1, 0.05, 120);
  scene.add(new THREE.AmbientLight(0x2a3a4c, 1.1));
  const rim = new THREE.DirectionalLight(0x7fd8e8, 0.9);
  rim.position.set(0, 2, -3);
  scene.add(rim);

  const desk = createDesk({ reduceMotion });
  scene.add(desk.group);

  const portrait = createPortrait({ columns: small ? 120 : 175, pixelRatio });
  portrait.group.position.set(1.0, 1.35, ZONE_Z.portrait);
  scene.add(portrait.group);

  const avatar = createAvatar();
  scene.add(avatar.root);
  // Toon materials need a clear key light to read as cel-shaded.
  // Lights that travel with the camera so the avatar is lit from the front everywhere.
  const avatarKey = new THREE.DirectionalLight(0xfff1dd, 2.6);
  avatarKey.position.set(1.5, 2.5, 1);
  avatarKey.target.position.set(0, 0, -5);
  const avatarFill = new THREE.DirectionalLight(0x9fd9ea, 0.9);
  avatarFill.position.set(-2, 0.5, 0.5);
  avatarFill.target.position.set(0, 0, -5);
  camera.add(avatarKey, avatarKey.target, avatarFill, avatarFill.target);
  scene.add(camera);

  const zones = createZones(ALL);
  scene.add(zones.group);
  scene.add(createStarfield(small ? 1800 : 3600));


  // Post-processing: bloom on screens, light strips and particles.
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), small ? 0.5 : 0.7, 0.5, 0.86);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  // Scroll -> target camera state.
  const sections = [...document.querySelectorAll('[data-scene]')];
  const frames = sections.map((s) => KEYFRAMES[s.dataset.scene] || KEYFRAMES.hero);
  const target = { ...frames[0] };
  const current = { ...frames[0] };
  const pose = { a: 'idle', b: 'idle', t: 0, mix: 0 };
  let chapter = -1;

  function readScroll() {
    const vh = window.innerHeight;
    let pos = 0;
    for (let i = 1; i < sections.length; i++) {
      pos += clamp01((vh * 0.9 - sections[i].getBoundingClientRect().top) / (vh * 0.9));
    }
    const i = Math.min(Math.floor(pos), frames.length - 1);
    const t = smooth(pos - i);
    const a = frames[i];
    const b = frames[Math.min(i + 1, frames.length - 1)];
    for (const k of KEYS) target[k] = a[k] + (b[k] - a[k]) * t;
    pose.a = CHAPTER_POSE[sections[i].dataset.scene] || 'idle';
    pose.b = CHAPTER_POSE[sections[Math.min(i + 1, sections.length - 1)].dataset.scene] || 'idle';
    pose.t = t;
    const now = Math.round(pos);
    if (now !== chapter) { chapter = now; onChapter(now, sections.length); }
  }
  window.addEventListener('scroll', readScroll, { passive: true });

  const pointer = { x: 0, y: 0, sx: 0, sy: 0 };
  if (!reduceMotion) {
    window.addEventListener('pointermove', (e) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
    }, { passive: true });
  }

  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    composer.setSize(w, h);
    bloom.setSize(w * pixelRatio, h * pixelRatio);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', () => { resize(); readScroll(); });
  resize();
  readScroll();
  Object.assign(current, target);

  const clock = new THREE.Clock();
  const look = new THREE.Vector3();
  const twinTarget = new THREE.Vector3();
  const axisX = new THREE.Vector3();
  const axisY = new THREE.Vector3();
  const axisZ = new THREE.Vector3();
  const twinEuler = new THREE.Euler();
  const twinTurn = new THREE.Quaternion();
  const twinFacing = new THREE.Quaternion();
  let lastScroll = window.scrollY;
  let scrollSpeed = 0;
  let fall = 0;

  portrait.ready.then(() => onReady());
  setTimeout(onReady, 5000);

  renderer.setAnimationLoop(() => {
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;
    const ease = reduceMotion ? 1 : 1 - Math.exp(-dt * 3.2);
    for (const k of KEYS) current[k] += (target[k] - current[k]) * ease;
    pointer.sx += (pointer.x - pointer.sx) * 0.05;
    pointer.sy += (pointer.y - pointer.sy) * 0.05;

    const portraitMode = camera.aspect < 0.8;
    const pull = portraitMode ? 1.5 : camera.aspect < 1.2 ? 1.2 : 1;
    const deskZone = current.cz > -1.5;
    // Phones: centre the content and back away, except while diving into the screen.
    const cz = deskZone ? current.cz : current.cz + (pull - 1) * 3.2;
    camera.position.set(current.cx + pointer.sx * 0.12, current.cy - pointer.sy * 0.08, cz);
    look.set(portraitMode ? current.tx * 0.1 : current.tx, current.ty - (portraitMode && !deskZone ? 0.35 : 0), current.tz);
    camera.lookAt(look);

    // White-cyan flash while the camera passes through the monitor and the wall.
    if (flash) flash.style.opacity = String(clamp01(1 - Math.abs(current.cz + 0.75) / 0.55) * 0.95);

    desk.group.visible = current.cz > -2.5;
    desk.update(t, dt, desk.group.visible);
    // Cartoon avatar: rides along with the camera, walks to the free side of each
    // chapter, strikes that chapter's pose, and skydives while the page scrolls fast.
    const sy = window.scrollY;
    scrollSpeed += (Math.abs(sy - lastScroll) / Math.max(dt, 0.001) - scrollSpeed) * 0.12;
    lastScroll = sy;
    let { px, py, ps } = current;
    if (portraitMode) { px *= 0.12; py += 1.05; ps *= 0.72; }
    twinTarget.copy(camera.position)
      .addScaledVector(axisX.set(1, 0, 0).applyQuaternion(camera.quaternion), px)
      .addScaledVector(axisY.set(0, 1, 0).applyQuaternion(camera.quaternion), py)
      .addScaledVector(axisZ.set(0, 0, -1).applyQuaternion(camera.quaternion), current.pd);
    const follow = reduceMotion ? 1 : 1 - Math.exp(-dt * 4);
    avatar.root.position.lerp(twinTarget, follow);
    fall += ((reduceMotion ? 0 : clamp01((scrollSpeed - 250) / 1600)) - fall) * 0.08;
    // Face the camera, turned three-quarters toward the middle of the screen.
    const yaw = (1 - fall) * -Math.sign(px) * 0.4 + pointer.sx * 0.25;
    twinTurn.setFromEuler(twinEuler.set(-pointer.sy * 0.08, yaw, Math.sin(t * 1.7) * 0.25 * fall));
    avatar.root.quaternion.slerp(twinFacing.copy(camera.quaternion).multiply(twinTurn), follow);
    avatar.root.scale.setScalar(Math.max(0.0001, ps));
    avatar.root.visible = ps > 0.02;
    pose.mix += (pose.t - pose.mix) * (reduceMotion ? 1 : 0.15);
    applyPose(avatar, pose.a, pose.b, pose.mix, fall, t, reduceMotion);

    // Particle portrait in the "who I am" chapter, streaming apart on fast scroll.
    const near = clamp01(1 - Math.abs(current.cz - KEYFRAMES.me.cz) / 4.2);
    portrait.update(t, reduceMotion ? (near > 0.2 ? 1 : 0) : near * (1 - fall * 0.7));
    zones.update(t, reduceMotion);

    composer.render();
  });
}
