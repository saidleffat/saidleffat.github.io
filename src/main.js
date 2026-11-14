import './style.css';
import { initUI } from './ui.js';
import { initScene } from './scene.js';
import { createBoot } from './boot.js';

const ui = initUI();
const boot = createBoot(document.getElementById('boot'));
initScene(document.getElementById('scene'), {
  flash: document.getElementById('flash'),
  onReady: () => boot.finish(),
  onChapter: ui.setChapter,
});
