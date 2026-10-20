import './styles.css';
import * as THREE from 'three';
import { createScene, type SceneRuntime } from './scene/create-scene';
import { buildExterior } from './scene/exterior/build-exterior';

const host = document.querySelector<HTMLElement>('#scene-root');
const status = document.querySelector<HTMLElement>('#status');

if (!host || !status) {
  throw new Error('Application shell is missing required elements.');
}

let runtime: SceneRuntime | null = null;
let frameId = 0;
let disposed = false;

function setStatus(message: string): void {
  if (status) status.textContent = message;
}

try {
  runtime = createScene(host);
} catch (error) {
  setStatus('Trình duy?t không th? kh?i d?ng WebGL. Hãy th? Chrome ho?c Safari m?i nh?t.');
  console.error(error);
}

if (runtime) {
  const exterior = buildExterior();
  runtime.scene.add(exterior.group);

  const poses = exterior.cameraPoses(window.innerWidth / Math.max(1, window.innerHeight));
  runtime.camera.position.copy(poses.intro.position);
  runtime.camera.lookAt(poses.intro.target);

  const render = () => {
    if (disposed || !runtime) return;
    runtime.renderer.render(runtime.scene, runtime.camera);
    frameId = window.requestAnimationFrame(render);
  };
  frameId = window.requestAnimationFrame(render);

  const onResize = () => {
    runtime?.resize();
  };
  window.addEventListener('resize', onResize);

  window.addEventListener('beforeunload', () => {
    disposed = true;
    window.cancelAnimationFrame(frameId);
    window.removeEventListener('resize', onResize);
    runtime?.dispose();
  }, { once: true });
}
