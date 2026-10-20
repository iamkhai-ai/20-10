import './styles.css';
import gsap from 'gsap';
import type * as THREE from 'three';
import { createScene, type SceneRuntime } from './scene/create-scene';
import { buildExterior } from './scene/exterior/build-exterior';
import { buildBedroom, type BedroomBuildResult } from './scene/interior/build-bedroom';
import { loadExteriorModel } from './scene/assets/load-exterior-model';
import { loadBedroomModel, type ImportedBedroom } from './scene/assets/load-bedroom-model';
import { disposeObjectResources } from './scene/dispose-object-resources';
import { createCameraStory, type CameraStoryHandle, type StoryPhase } from './experience/camera-story';
import { createIntroControls, storyCopy } from './ui/intro-controls';
import { createWateringInteraction, type WateringInteraction } from './experience/watering-interaction';
import { wateringCopy } from './ui/watering-controls';
import { createBloomInteraction, type BloomInteraction } from './experience/bloom-interaction';
import { bloomCopy } from './content/gift-message';

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
  try { startExperience(runtime, host); }
  catch (error) {
    runtime.dispose();
    status.textContent = 'Khu vườn chưa thể mở. Bạn thử tải lại trang nhé.';
    console.error(error);
  }
}

function startExperience(runtime: SceneRuntime, host: HTMLElement): void {
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const exterior = buildExterior();
  exterior.group.visible = false;
  runtime.scene.add(exterior.group);
  let room: BedroomBuildResult | null = null;
  let watering: WateringInteraction | null = null;
  let bloom: BloomInteraction | null = null;
  let bloomRequested = false, bloomStarted = false;
  let wateringFailed = false;
  let currentPhase: StoryPhase | null = null;
  let roomState: 'pending' | 'ready' | 'unavailable' = 'pending';
  let story: CameraStoryHandle | null = null;
  let location: 'exterior' | 'bedroom' = 'exterior';
  let skipRequested = false;
  let disposed = false;
  let frameId = 0;
  let serial = 0;
  let attempt: { id: number; controller: AbortController; deadline: number } | null = null;
  const exteriorController = new AbortController();
  const swayTweens: gsap.core.Tween[] = [];
  const restRotations = new Map<THREE.Object3D, number>();
  const controls = createIntroControls(() => {
    if (story) story.skip();
    else { skipRequested = true; controls.setStatus(storyCopy.queuedSkip); }
  }, () => { if (roomState === 'unavailable') void loadRoom(); });
  controls.setStatus(storyCopy.loading);

  const displayPhase = (next: StoryPhase) => {
    const waitingRetry = next === 'bedroom-unavailable' && attempt !== null;
    if (next !== 'desk-settled' || currentPhase !== next) {
      controls.setStatus(next === 'desk-settled' && wateringFailed ? wateringCopy.unavailable :
        waitingRetry ? storyCopy.retrying : storyCopy.phases[next]);
    }
    currentPhase = next;
    controls.setSettled(next === 'desk-settled' || (next === 'bedroom-unavailable' && !waitingRetry));
    controls.setRetryVisible(next === 'bedroom-unavailable' && roomState === 'unavailable' && !attempt);
    watering?.setAvailable(next === 'desk-settled' && location === 'bedroom' && !bloomStarted);
    bloom?.setAvailable(next === 'desk-settled' && location === 'bedroom');
  };
  const updateSway = () => {
    for (const tween of swayTweens) tween.kill();
    swayTweens.length = 0;
    for (const [target, rotation] of restRotations) target.rotation.z = rotation;
    if (motion.matches || disposed) return;
    const targets = location === 'bedroom' ? room?.swayTargets ?? [] : exterior.swayTargets;
    for (const target of targets) {
      if (!restRotations.has(target)) restRotations.set(target, target.rotation.z);
      swayTweens.push(gsap.to(target.rotation, {
        z: restRotations.get(target)! + (location === 'bedroom' ? 0.012 : 0.025),
        duration: 3.6, ease: 'sine.inOut', yoyo: true, repeat: -1,
      }));
    }
  };
  const activate = (next: 'exterior' | 'bedroom') => {
    if (next === 'bedroom' && !room) throw new Error('Bedroom is not ready.');
    watering?.setAvailable(false);
    bloom?.setAvailable(false);
    location = next;
    exterior.group.visible = next === 'exterior';
    if (room) room.group.visible = next === 'bedroom';
    runtime.setLocation(next);
    updateSway();
  };
  const syncRoomToStory = () => {
    if (roomState === 'ready' && room) story?.setBedroom(room.cameraPoses);
    else if (roomState === 'unavailable') story?.setBedroomUnavailable();
  };
  const onResize = () => { watering?.pause(); runtime.resize(); story?.reframe(); };
  const onMotion = () => { watering?.setReducedMotion(motion.matches); bloom?.setReducedMotion(motion.matches); story?.setReducedMotion(motion.matches); updateSway(); };
  const observer = new ResizeObserver(onResize);
  observer.observe(host);
  window.addEventListener('resize', onResize);
  motion.addEventListener('change', onMotion);
  const render = (now: number) => {
    if (disposed) return;
    watering?.update(now);
    if (bloomRequested) {
      bloomRequested = false; bloomStarted = true; watering?.setAvailable(false);
      if (bloom) bloom.start(); else controls.setStatus(bloomCopy.unavailable);
    }
    bloom?.update(now);
    runtime.renderer.render(runtime.scene, runtime.camera);
    frameId = window.requestAnimationFrame(render);
  };
  frameId = window.requestAnimationFrame(render);
  const exteriorDeadline = window.setTimeout(() => exteriorController.abort(
    new DOMException('Exterior load deadline exceeded.', 'TimeoutError')), 12_000);

  const dispose = () => {
    if (disposed) return;
    disposed = true;
    serial++;
    window.clearTimeout(exteriorDeadline);
    exteriorController.abort();
    if (attempt) { window.clearTimeout(attempt.deadline); attempt.controller.abort(); attempt = null; }
    window.cancelAnimationFrame(frameId);
    window.removeEventListener('resize', onResize);
    window.removeEventListener('beforeunload', dispose);
    motion.removeEventListener('change', onMotion);
    observer.disconnect();
    for (const tween of swayTweens) tween.kill();
    restRotations.clear();
    bloom?.dispose(); bloom = null;
    watering?.dispose(); watering = null;
    story?.dispose();
    controls.dispose();
    runtime.dispose();
  };
  window.addEventListener('beforeunload', dispose, { once: true });

  async function loadRoom(): Promise<void> {
    if (disposed || attempt) return;
    bloom?.dispose(); bloom = null; bloomRequested = false; bloomStarted = false;
    watering?.dispose(); watering = null; wateringFailed = false;
    if (room) {
      for (const target of room.swayTargets) restRotations.delete(target);
      runtime.scene.remove(room.group);
      disposeObjectResources([room.group], [runtime.scene]);
      room = null;
    }
    roomState = 'pending';
    controls.setRetryVisible(false);
    if (story) { controls.setStatus(storyCopy.retrying); controls.setSettled(false); }
    const controller = new AbortController();
    const current = { id: ++serial, controller, deadline: window.setTimeout(() => controller.abort(
      new DOMException('Bedroom load deadline exceeded.', 'TimeoutError')), 12_000) };
    attempt = current;
    let parsed: ImportedBedroom | null = null;
    try {
      parsed = await loadBedroomModel('/models/bedroom.glb', controller.signal);
      if (disposed || serial !== current.id) { disposeObjectResources([parsed.group]); return; }
      const built = buildBedroom(parsed);
      runtime.scene.add(built.group);
      room = built;
      parsed = null; // Scene teardown owns the attached model now.
      roomState = 'ready';
      try {
        watering = createWateringInteraction({ canvas: runtime.renderer.domElement,
          camera: runtime.camera, bedroom: built, reducedMotion: motion.matches,
          onComplete: () => { bloomRequested = true; } });
      } catch (error) {
        wateringFailed = true;
        console.warn('Watering is unavailable; keeping the bedroom.', error);
      }
      try {
        bloom = createBloomInteraction({ canvas: runtime.renderer.domElement,
          camera: runtime.camera, bedroom: built, reducedMotion: motion.matches });
      } catch (error) { console.warn('Card presentation is unavailable; keeping the bedroom.', error); }
    } catch (error) {
      if (parsed) disposeObjectResources([parsed.group], [runtime.scene]);
      if (disposed || serial !== current.id) return;
      roomState = 'unavailable';
      console.warn('Bedroom is unavailable; keeping the garden.', error);
    } finally {
      window.clearTimeout(current.deadline);
      if (attempt === current) attempt = null;
    }
    if (disposed || serial !== current.id) return;
    syncRoomToStory();
  }

  // Both selections start independently; a slow room never blocks the exterior.
  void loadRoom();
  void (async () => {
    try {
      const model = await loadExteriorModel('/models/exterior-house-tree.glb', exteriorController.signal);
      if (disposed) { disposeObjectResources([model.group]); return; }
      try { exterior.replaceArchitecture(model); }
      catch (error) { disposeObjectResources([model.group], [runtime.scene]); throw error; }
    } catch (error) {
      if (disposed) return;
      console.warn('Using the garden exterior fallback.', error);
    } finally { window.clearTimeout(exteriorDeadline); }
    if (disposed) return;
    exterior.group.visible = true;
    story = createCameraStory(runtime.camera, exterior.cameraPoses, {
      reducedMotion: motion.matches,
      onPhase: displayPhase,
      onLocation: activate,
      onVeil: controls.setVeil,
      onError: (error) => {
        roomState = 'unavailable';
        console.warn('Bedroom reveal was interrupted.', error);
        displayPhase('bedroom-unavailable');
      },
    });
    syncRoomToStory();
    if (skipRequested) story.skip();
    updateSway();
  })();
}
