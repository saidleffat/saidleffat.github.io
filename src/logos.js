import {
  siSpringboot, siAngular, siReact, siTypescript, siPython, siFastapi, siNestjs,
  siPostgresql, siMysql, siMongodb, siRedis, siDocker, siKubernetes, siJenkins,
  siSonarqube, siPrometheus, siGrafana, siGit, siGithub, siLangchain, siOllama,
  siGooglegemini, siOdoo, siStripe, siNginx, siLinux, siOpenjdk, siKeycloak, siTailwindcss,
} from 'simple-icons';

// Brand marks from Simple Icons (CC0). Very dark brand colours are lifted to a
// light tone so they stay visible on the night background.
function tone(hex) {
  const n = parseInt(hex, 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return lum < 0.22 ? '#e8eef2' : `#${hex}`;
}
const pick = (icon, label = icon.title) => ({ label, path: icon.path, color: tone(icon.hex) });

export const STACK = {
  dev: [pick(siOpenjdk, 'Java'), pick(siSpringboot, 'Spring Boot'), pick(siPython), pick(siFastapi), pick(siNestjs), pick(siTypescript), pick(siAngular), pick(siReact), pick(siTailwindcss)],
  ai: [pick(siLangchain), pick(siOllama), pick(siGooglegemini, 'Gemini')],
  ops: [pick(siDocker), pick(siKubernetes), pick(siJenkins), pick(siSonarqube), pick(siPrometheus), pick(siGrafana), pick(siNginx), pick(siGit), pick(siGithub), pick(siLinux)],
  data: [pick(siPostgresql), pick(siMysql), pick(siMongodb), pick(siRedis), pick(siKeycloak), pick(siOdoo), pick(siStripe)],
};

export const ALL = [...STACK.dev, ...STACK.ai, ...STACK.ops, ...STACK.data];

export function svgMarkup(logo, size = 24) {
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true" focusable="false"><path fill="currentColor" d="${logo.path}"/></svg>`;
}
