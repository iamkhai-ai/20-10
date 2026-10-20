import * as THREE from 'three';
import type { BedroomBuildResult } from '../scene/interior/build-bedroom';
import { createWateringView } from '../scene/interior/build-watering';
import { createWateringControls, type WateringControls } from '../ui/watering-controls';
import { createWateringState } from './watering-state';

export interface WateringInteraction {
  setAvailable(value: boolean): void;
  update(now: number): void;
  pause(): void;
  setReducedMotion(value: boolean): void;
  dispose(): void;
}

export function createWateringInteraction(options: {
  canvas: HTMLCanvasElement; camera: THREE.PerspectiveCamera;
  bedroom: BedroomBuildResult; reducedMotion: boolean;
  onComplete?: () => void;
}): WateringInteraction {
  const { canvas, camera, bedroom } = options;
  const raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2();
  const hits: THREE.Intersection[] = [];
  const oldTouchAction = canvas.style.touchAction, oldCursor = canvas.style.cursor;
  let pointerId: number | null = null, disposed = false;
  const view = createWateringView(bedroom.watering, { reducedMotion: options.reducedMotion });
  const release = () => {
    const id = pointerId; pointerId = null;
    if (id !== null && canvas.hasPointerCapture(id)) canvas.releasePointerCapture(id);
    canvas.style.cursor = oldCursor;
  };
  const state = createWateringState(() => {
    release(); view.cancel(false); options.onComplete?.();
  });
  const canAct = () => !disposed && state.snapshot().available && !state.snapshot().complete &&
    !document.hidden && document.hasFocus();
  const stop = (immediate = false) => {
    if (disposed) return;
    state.pause(performance.now()); release(); view.cancel(immediate); controls.render(state.snapshot());
  };
  let controls: WateringControls;
  try { controls = createWateringControls({
    onPause: () => stop(true),
    onToggle: () => {
      if (!canAct()) return;
      if (state.snapshot().mode === 'button') { stop(); return; }
      stop(true);
      const now = performance.now(); state.setAction('button', now);
      view.aimAutomatically(); state.setAim(view.isValidAim(), now); controls.render(state.snapshot());
    },
  }); } catch (error) {
    state.dispose(); view.dispose(); throw error;
  }
  const ray = (event: PointerEvent) => {
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return false;
    pointer.set((event.clientX - rect.left) / rect.width * 2 - 1,
      -(event.clientY - rect.top) / rect.height * 2 + 1);
    camera.updateWorldMatrix(true, false); raycaster.setFromCamera(pointer, camera);
    return true;
  };
  const pick = () => {
    hits.length = 0; bedroom.watering.can.updateWorldMatrix(true, true);
    raycaster.intersectObject(bedroom.watering.can, true, hits);
    return hits.length > 0;
  };
  const down = (event: PointerEvent) => {
    if (!canAct() || pointerId !== null || !event.isPrimary || event.button !== 0 || !ray(event) || !pick()) return;
    event.preventDefault(); stop(true); pointerId = event.pointerId;
    try { canvas.setPointerCapture(event.pointerId); } catch { /* Synthetic events may have no active pointer. */ }
    state.setAction('drag', performance.now()); view.beginDrag(); canvas.style.cursor = 'grabbing';
    controls.render(state.snapshot());
  };
  const move = (event: PointerEvent) => {
    if (!canAct() || !ray(event)) return;
    if (pointerId === null) { canvas.style.cursor = pick() ? 'grab' : oldCursor; return; }
    if (event.pointerId !== pointerId) return;
    event.preventDefault();
    const now = performance.now(); state.advance(now);
    if (state.snapshot().complete) return;
    view.drag(raycaster.ray); state.setAim(view.isValidAim(), now); controls.render(state.snapshot());
  };
  const up = (event: PointerEvent) => { if (event.pointerId === pointerId) stop(); };
  const cancel = (event: PointerEvent) => { if (event.pointerId === pointerId) stop(true); };
  const blur = () => stop(true);
  const visibility = () => { if (document.hidden) stop(true); };
  const key = (event: KeyboardEvent) => { if (event.key === 'Escape') stop(true); };
  canvas.addEventListener('pointerdown', down); canvas.addEventListener('pointermove', move);
  canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', cancel);
  canvas.addEventListener('lostpointercapture', cancel);
  window.addEventListener('blur', blur); document.addEventListener('visibilitychange', visibility);
  window.addEventListener('keydown', key);
  return {
    setAvailable(value) {
      if (disposed) return;
      if (!value) stop(true);
      state.setAvailable(value, performance.now()); controls.setVisible(value); controls.render(state.snapshot());
      canvas.style.touchAction = value ? 'none' : oldTouchAction;
    },
    update(now) {
      if (disposed) return;
      if ((document.hidden || !document.hasFocus()) && state.snapshot().mode !== 'none') stop(true);
      state.setAim(view.isValidAim(), now);
      const snapshot = state.advance(now);
      view.render(now, snapshot.phase === 'watering', snapshot.progress); controls.render(snapshot);
    },
    pause: () => stop(true),
    setReducedMotion(value) { if (!disposed) { stop(true); view.setReducedMotion(value); } },
    dispose() {
      if (disposed) return;
      stop(true); disposed = true; state.dispose();
      canvas.removeEventListener('pointerdown', down); canvas.removeEventListener('pointermove', move);
      canvas.removeEventListener('pointerup', up); canvas.removeEventListener('pointercancel', cancel);
      canvas.removeEventListener('lostpointercapture', cancel); window.removeEventListener('blur', blur);
      document.removeEventListener('visibilitychange', visibility); window.removeEventListener('keydown', key);
      canvas.style.touchAction = oldTouchAction; canvas.style.cursor = oldCursor;
      controls.dispose(); view.dispose();
    },
  };
}
