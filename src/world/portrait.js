import * as THREE from 'three';

// Particle portrait: every bright pixel of the photo becomes a glowing point.
// uAssemble 0 = scattered dust, 1 = the face. Falls back to the initials "MSL".

const VERTEX = /* glsl */ `
  uniform float uTime;
  uniform float uAssemble;
  uniform float uSize;
  attribute vec3 aScatter;
  attribute vec3 aColor;
  attribute float aSeed;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float a = smoothstep(0.0, 1.0, clamp(uAssemble * 1.25 - aSeed * 0.25, 0.0, 1.0));
    vec3 p = mix(aScatter, position, a);
    p += vec3(sin(uTime * 0.9 + aSeed * 40.0), cos(uTime * 0.7 + aSeed * 31.0), sin(uTime * 0.5 + aSeed * 17.0)) * (0.006 + (1.0 - a) * 0.08);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * (0.8 + aSeed * 0.6) / -mv.z;
    vColor = aColor;
    vAlpha = mix(0.35, 1.0, a);
  }
`;

const FRAGMENT = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float glow = smoothstep(0.5, 0.0, d);
    gl_FragColor = vec4(vColor * (0.32 + glow * 0.4), glow * vAlpha * 0.8);
  }
`;

function sampleImage(img, columns) {
  const ratio = img.naturalHeight / img.naturalWidth;
  const w = columns;
  const h = Math.round(columns * ratio);
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.drawImage(img, 0, 0, w, h);
  return { data: g.getImageData(0, 0, w, h).data, w, h };
}

function sampleText(text, columns) {
  const w = columns, h = Math.round(columns * 0.5);
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#fff';
  g.font = `800 ${Math.round(h * 0.62)}px Syne, sans-serif`;
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(text, w / 2, h / 2);
  return { data: g.getImageData(0, 0, w, h).data, w, h };
}

function buildPoints({ data, w, h }, height, isPhoto) {
  const pos = [], scatter = [], color = [], seed = [];
  const cx = w / 2, cy = h / 2;
  const scale = height / h;
  const warm = new THREE.Color(0xffc08a);
  const cool = new THREE.Color(0x7fd8e8);
  const c = new THREE.Color();
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const r = data[i] / 255, g = data[i + 1] / 255, b = data[i + 2] / 255;
      const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      // Photo: keep the lit face and clothes edge; skip the dark background.
      const dx = (x - cx) / w, dy = (y - cy) / h;
      if (isPhoto ? lum < 0.13 || Math.hypot(dx, dy) > 0.5 : lum < 0.5) continue;
      pos.push((x - cx) * scale, (cy - y) * scale, lum * 0.35);
      const rr = 3 + Math.random() * 5, th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1);
      scatter.push(Math.sin(ph) * Math.cos(th) * rr, Math.sin(ph) * Math.sin(th) * rr * 0.6, Math.cos(ph) * rr);
      c.setRGB(r, g, b).lerp(lum > 0.55 ? warm : cool, isPhoto ? 0.28 : 0.6);
      color.push(c.r, c.g, c.b);
      seed.push(Math.random());
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('aScatter', new THREE.Float32BufferAttribute(scatter, 3));
  geo.setAttribute('aColor', new THREE.Float32BufferAttribute(color, 3));
  geo.setAttribute('aSeed', new THREE.Float32BufferAttribute(seed, 1));
  return geo;
}

export function createPortrait({ columns, pixelRatio }) {
  const group = new THREE.Group();
  const uniforms = {
    uTime: { value: 0 },
    uAssemble: { value: 0 },
    uSize: { value: 24 * pixelRatio },
  };
  const material = new THREE.ShaderMaterial({
    uniforms, vertexShader: VERTEX, fragmentShader: FRAGMENT,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  let points = null;

  function use(sample, isPhoto) {
    if (points) { group.remove(points); points.geometry.dispose(); }
    points = new THREE.Points(buildPoints(sample, 2.1, isPhoto), material);
    group.add(points);
  }

  const ready = new Promise((resolve) => {
    const img = new Image();
    let triedPng = false;
    img.onload = () => { use(sampleImage(img, columns), true); resolve(); };
    img.onerror = () => {
      if (!triedPng) { triedPng = true; img.src = `${import.meta.env.BASE_URL}images/photo.png`; return; }
      document.fonts.ready.then(() => { use(sampleText('MSL', columns * 2), false); resolve(); });
    };
    img.src = `${import.meta.env.BASE_URL}images/photo.jpg`;
  });

  return {
    group,
    ready,
    update(t, assemble) {
      uniforms.uTime.value = t;
      uniforms.uAssemble.value = assemble;
    },
  };
}
