import * as THREE from 'three';
import type { BedroomBuildResult } from '../scene/interior/build-bedroom';
import { createBloomView, bloomDuration } from '../scene/interior/build-bloom';
import { createCardControls } from '../ui/card-controls';
import { bloomCopy } from '../content/gift-message';

export interface BloomInteraction {
  start(): void;
  update(now: number): void;
  setAvailable(value: boolean): void;
  setReducedMotion(value: boolean): void;
  dispose(): void;
}

export function createBloomInteraction(options: {
  canvas: HTMLCanvasElement; camera: THREE.PerspectiveCamera;
  bedroom: BedroomBuildResult; reducedMotion: boolean;
}): BloomInteraction {
  const { canvas, camera, bedroom } = options;
  const controls = createCardControls();
  let view: ReturnType<typeof createBloomView>;
  try { view = createBloomView(bedroom.watering, camera); } catch (error) { controls.dispose(); throw error; }
  const status = document.querySelector<HTMLElement>('#status')!;
  const raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2(), hits: THREE.Intersection[] = [];
  let started = false, finished = false, available = false, disposed = false;
  let elapsed = 0, last: number | null = null, reducedMotion = options.reducedMotion;
  let down: { id: number; x: number; y: number } | null = null;
  const originalCursor = canvas.style.cursor;
  const pick = (event: PointerEvent) => {
    const rect = canvas.getBoundingClientRect(); if (rect.width <= 0 || rect.height <= 0) return false;
    pointer.set((event.clientX-rect.left)/rect.width*2-1, -(event.clientY-rect.top)/rect.height*2+1);
    camera.updateWorldMatrix(true, false); view.card.updateWorldMatrix(true, true);
    raycaster.setFromCamera(pointer, camera); hits.length = 0;
    raycaster.intersectObject(view.card, true, hits); return hits.length > 0;
  };
  const canOpen = () => !disposed && available && finished && !document.hidden;
  const pointerDown = (event: PointerEvent) => {
    if (canOpen() && event.isPrimary && event.button === 0 && down === null && pick(event)) {
      down = { id: event.pointerId, x: event.clientX, y: event.clientY };
    }
  };
  const pointerUp = (event: PointerEvent) => {
    const previous = down;
    if (!previous || previous.id !== event.pointerId) return;
    down = null;
    if (canOpen() && Math.hypot(previous.x-event.clientX, previous.y-event.clientY) < 12 && pick(event)) controls.open();
  };
  const cancel = () => { down = null; canvas.style.cursor = originalCursor; };
  const move = (event: PointerEvent) => { if (canOpen()) canvas.style.cursor = pick(event) ? 'pointer' : originalCursor; };
  const visibility = () => { last = null; cancel(); };
  canvas.addEventListener('pointerdown', pointerDown); canvas.addEventListener('pointerup', pointerUp);
  canvas.addEventListener('pointermove', move); canvas.addEventListener('pointercancel', cancel);
  canvas.addEventListener('lostpointercapture', cancel); window.addEventListener('blur', cancel);
  window.addEventListener('pointerup', cancel); document.addEventListener('visibilitychange', visibility);
  return {
    start() {
      if (disposed || started || !available) return;
      started = true; last = null; status.textContent = bloomCopy.blooming; view.setProgress(0);
    },
    update(now) {
      if (disposed || !started) return;
      if (!available || document.hidden || !Number.isFinite(now)) { last = null; return; }
      if (!finished) {
        if (reducedMotion) elapsed = bloomDuration;
        else if (last !== null) elapsed = Math.min(bloomDuration, elapsed + Math.max(0, now-last));
        last = now;
      }
      view.setProgress(elapsed);
      if (!finished && elapsed >= bloomDuration) {
        finished = true; status.textContent = bloomCopy.ready; controls.setReady(true);
      }
    },
    setAvailable(value) {
      if (disposed) return; available = value; last = null;
      if (!value) cancel(); controls.setReady(value && finished);
    },
    setReducedMotion(value) { if (!disposed) { reducedMotion = value; last = null; cancel(); } },
    dispose() {
      if (disposed) return; disposed = true; cancel();
      canvas.removeEventListener('pointerdown', pointerDown); canvas.removeEventListener('pointerup', pointerUp);
      canvas.removeEventListener('pointermove', move); canvas.removeEventListener('pointercancel', cancel);
      canvas.removeEventListener('lostpointercapture', cancel); window.removeEventListener('blur', cancel);
      window.removeEventListener('pointerup', cancel); document.removeEventListener('visibilitychange', visibility);
      controls.dispose(); view.dispose();
    },
  };
}
