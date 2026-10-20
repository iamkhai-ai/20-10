import './styles.css';
import * as THREE from 'three';
import gsap from 'gsap';
import { createScene, type SceneRuntime } from './scene/create-scene';
import { buildExterior } from './scene/exterior/build-exterior';
import { createCameraStory } from './experience/camera-story';
import { createIntroControls } from './ui/intro-controls';

const host = document.querySelector<HTMLElement>('#scene-root');
const status = document.querySelector<HTMLElement>('#status');

if (!host || !status) {
  throw new Error('Application shell is missing required elements.');
}

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let runtime: SceneRuntime | null = null;
let frameId = 0;
let disposed = false;
const swayTweens: gsap.core.Tween[] = [];

function setStatus(message: string): void {
  if (status) status.textContent = message;
}

try {
  runtime = createScene(host);
} catch (error) {
  setStatus('Trình duyệt không thể khởi động WebGL. Hãy thử Chrome hoặc Safari mới nhất.');
  console.error(error);
}

if (runtime) {
  const exterior = buildExterior();
  runtime.scene.add(exterior.group);

  const controls = createIntroControls(() => story.skip());
  const story = createCameraStory(runtime.camera, exterior.cameraPoses, {
    reducedMotion,
    onArrive: () => {
      controls.setStatus('Đã đến cửa sổ trên lầu.');
    },
  });

  if (!reducedMotion) {
    for (const target of exterior.swayTargets) {
      swayTweens.push(
        gsap.to(target.rotation, {
          z: 0.06,
          duration: 3.2,
          ease: 'sine.inOut',
          yoyo: true,
          repeat: -1,
        }),
      );
    }
  }

  const render = () => {
    if (disposed || !runtime) return;
    runtime.renderer.render(runtime.scene, runtime.camera);
    frameId = window.requestAnimationFrame(render);
  };
  frameId = window.requestAnimationFrame(render);

  const onResize = () => {
    runtime?.resize();
    story.reframe();
  };
  window.addEventListener('resize', onResize);

  window.addEventListener('beforeunload', () => {
    disposed = true;
    window.cancelAnimationFrame(frameId);
    window.removeEventListener('resize', onResize);
    for (const tween of swayTweens) tween.kill();
    story.dispose();
    controls.dispose();
    runtime?.dispose();
  }, { once: true });
}
