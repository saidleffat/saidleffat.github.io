import * as THREE from 'three';

export const FONT_MONO = '"JetBrains Mono", ui-monospace, Menlo, monospace';
export const FONT_DISPLAY = 'Syne, "Segoe UI", system-ui, sans-serif';
export const FONT_BODY = 'Inter, "Segoe UI", system-ui, sans-serif';

export function canvasTexture(width, height, draw) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  draw(ctx, width, height);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return { tex, canvas, ctx };
}

// Syntax colours for the on-screen code (cool cyan world, warm amber accents).
const TOKENS = [
  [/(@\w+)/g, '#f2b35b'],
  [/\b(public|private|final|class|return|new|def|import|from|await|async)\b/g, '#7fd8e8'],
  [/("[^"]*")/g, '#b6e3a1'],
  [/(#.*$|\/\/.*$)/g, '#5d7180'],
];

export function drawCodeLine(ctx, line, x, y) {
  // Paint the whole line, then repaint matched tokens on top in their colour.
  ctx.fillStyle = '#d7e3ea';
  ctx.fillText(line, x, y);
  for (const [re, color] of TOKENS) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(line))) {
      const before = line.slice(0, m.index);
      ctx.fillStyle = color;
      ctx.fillText(m[0], x + ctx.measureText(before).width, y);
      if (!re.global) break;
    }
  }
}
