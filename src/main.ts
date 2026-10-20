import './styles.css';
import gsap from 'gsap';
import { createScene, type SceneRuntime } from './scene/create-scene';
import { buildExterior } from './scene/exterior/build-exterior';
import { loadExteriorModel } from './scene/assets/load-exterior-model';
import { disposeObjectResources } from './scene/dispose-object-resources';
import { createCameraStory, type CameraStoryHandle } from './experience/camera-story';
import { createIntroControls } from './ui/intro-controls';

const host = document.querySelector<HTMLElement>('#scene-root');
const status = document.querySelector<HTMLElement>('#status');
if (!host || !status) throw new Error('Application shell is missing required elements.');

let runtime: SceneRuntime | null = null;
try {
  runtime = createScene(host);
} catch (error) {
  status.textContent = 'Trình duyệt không thể khởi động WebGL. Hãy thử Chrome hoặc Safari mới nhất.';
  console.error(error);
}

if (runtime) {
  try {
    startExperience(runtime, host);
  } catch (error) {
    runtime.dispose();
    status.textContent = 'Khu vườn chưa thể mở. Bạn thử tải lại trang nhé.';
    console.error(error);
  }
}

function startExperience(runtime: SceneRuntime, host: HTMLElement): void {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const exterior = buildExterior();
  exterior.group.visible = false;
  runtime.scene.add(exterior.group);

  let story: CameraStoryHandle | null = null;
  let skipRequested = false;
  let disposed = false;
  let frameId = 0;
  const swayTweens: gsap.core.Tween[] = [];
  const controller = new AbortController();
  const controls = createIntroControls(() => {
    if (story) story.skip();
    else {
      skipRequested = true;
      controls.setStatus('Khu vườn sẵn sàng là mình đến cửa sổ nhé…');
    }
  });
  controls.setStatus('Đang chuẩn bị khu vườn…');
  const onResize = () => {
    runtime.resize();
    story?.reframe();
  };
  const resizeObserver = new ResizeObserver(onResize);
  resizeObserver.observe(host);
  window.addEventListener('resize', onResize);

  const render = () => {
    if (disposed) return;
    runtime.renderer.render(runtime.scene, runtime.camera);
    frameId = window.requestAnimationFrame(render);
  };
  frameId = window.requestAnimationFrame(render);

  const deadline = window.setTimeout(() => {
    controller.abort(new DOMException('Exterior load deadline exceeded.', 'TimeoutError'));
  }, 12_000);

  const dispose = () => {
    if (disposed) return;
    disposed = true;
    window.clearTimeout(deadline);
    controller.abort();
    window.cancelAnimationFrame(frameId);
    window.removeEventListener('resize', onResize);
    resizeObserver.disconnect();
    for (const tween of swayTweens) tween.kill();
    story?.dispose();
    controls.dispose();
    runtime.dispose();
  };
  window.addEventListener('beforeunload', dispose, { once: true });

  void (async () => {
    try {
      const model = await loadExteriorModel('/models/exterior-house-tree.glb', controller.signal);
      if (disposed) {
        disposeObjectResources([model.group]);
        return;
      }
      try {
        exterior.replaceArchitecture(model);
      } catch (error) {
        disposeObjectResources([model.group], [runtime.scene]);
        throw error;
      }
    } catch (error) {
      if (disposed) return;
      console.warn('Using the garden exterior fallback.', error);
    } finally {
      window.clearTimeout(deadline);
    }
    if (disposed) return;
    exterior.group.visible = true;
    controls.setStatus('Đang đến cửa sổ trên lầu…');
    story = createCameraStory(runtime.camera, exterior.cameraPoses, {
      reducedMotion: reducedMotion || skipRequested,
      onArrive: () => controls.setStatus('Đã đến cửa sổ trên lầu.'),
    });
    if (!reducedMotion) {
      for (const target of exterior.swayTargets) {
        swayTweens.push(gsap.to(target.rotation, {
          z: target.rotation.z + 0.025,
          duration: 3.6,
          ease: 'sine.inOut',
          yoyo: true,
          repeat: -1,
        }));
      }
    }
  })();
}
