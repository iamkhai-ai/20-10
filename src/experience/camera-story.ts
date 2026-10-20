import * as THREE from 'three';
import gsap from 'gsap';

export interface CameraPose { position: THREE.Vector3; target: THREE.Vector3 }
export interface CameraPosePair { intro: CameraPose; arrival: CameraPose }
export interface BedroomPoses { entry: CameraPose; room: CameraPose; desk: CameraPose }
export type StoryPhase = 'exterior-intro' | 'window-arrival' | 'bedroom-reveal' |
  'desk-settled' | 'bedroom-unavailable';
export interface CameraStoryHandle {
  skip(): void;
  reframe(): void;
  setBedroom(getPoses: (aspect: number) => BedroomPoses): void;
  setBedroomUnavailable(): void;
  setReducedMotion(value: boolean): void;
  dispose(): void;
}
interface StoryOptions {
  reducedMotion: boolean;
  onPhase?: (phase: StoryPhase) => void;
  onLocation?: (location: 'exterior' | 'bedroom') => void;
  onVeil?: (opacity: number) => void;
  onError?: (error: unknown) => void;
  onArrive?: () => void;
}

export function createCameraStory(
  camera: THREE.PerspectiveCamera,
  getPoses: (aspect: number) => CameraPosePair,
  options: StoryOptions,
): CameraStoryHandle {
  let exterior = getPoses(camera.aspect);
  let getBedroom: ((aspect: number) => BedroomPoses) | null = null;
  let bedroom: BedroomPoses | null = null;
  let roomState: 'pending' | 'ready' | 'unavailable' = 'pending';
  let phase: StoryPhase | null = null;
  let segment: 'intro' | 'cover' | 'uncover' | 'hold' | 'desk' | 'idle' = 'intro';
  let location: 'exterior' | 'bedroom' = 'exterior';
  let reducedMotion = options.reducedMotion;
  let skipped = false;
  let arrived = false;
  let disposed = false;
  let epoch = 0;
  let animation: gsap.core.Animation | null = null;
  const clock = { value: 0 };
  const position = new THREE.Vector3();
  const target = new THREE.Vector3();
  const nearWindow: CameraPose = { position: new THREE.Vector3(), target: new THREE.Vector3() };

  const refresh = () => {
    exterior = getPoses(camera.aspect);
    bedroom = getBedroom?.(camera.aspect) ?? null;
    nearWindow.position.lerpVectors(exterior.arrival.position, exterior.arrival.target, 0.08);
    nearWindow.target.copy(exterior.arrival.target);
  };
  const stop = () => { epoch++; animation?.kill(); animation = null; };
  const setPhase = (next: StoryPhase) => {
    if (phase === next) return;
    phase = next;
    options.onPhase?.(next);
  };
  const setLocation = (next: 'exterior' | 'bedroom') => {
    if (location === next) return;
    options.onLocation?.(next);
    location = next;
  };
  const veil = (opacity: number) => options.onVeil?.(opacity);
  const apply = () => {
    let from: CameraPose;
    let to: CameraPose;
    switch (segment) {
      case 'intro': from = exterior.intro; to = exterior.arrival; break;
      case 'cover': from = exterior.arrival; to = nearWindow; veil(clock.value); break;
      case 'uncover': from = bedroom!.entry; to = bedroom!.room; veil(1 - Math.min(1, clock.value * 2)); break;
      case 'hold': from = to = bedroom!.room; break;
      case 'desk': from = bedroom!.room; to = bedroom!.desk; break;
      default: from = to = phase === 'desk-settled' && bedroom ? bedroom.desk : exterior.arrival;
    }
    position.lerpVectors(from.position, to.position, clock.value);
    target.lerpVectors(from.target, to.target, clock.value);
    camera.position.copy(position);
    camera.lookAt(target);
  };
  const recover = (error: unknown) => {
    stop();
    roomState = 'unavailable';
    segment = 'idle';
    try {
      // The failed callback may already have activated the room before throwing.
      options.onLocation?.('exterior'); location = 'exterior';
      veil(0); setPhase('bedroom-unavailable'); apply();
    }
    catch (restoreError) { console.error('Could not restore the exterior view.', restoreError); }
    options.onError?.(error);
  };
  const run = (action: () => void) => {
    if (disposed) return;
    try { action(); } catch (error) { recover(error); }
  };
  const guarded = (id: number, action: () => void) => () => {
    if (id === epoch) run(action);
  };
  const settleDesk = () => {
    stop();
    setLocation('bedroom');
    segment = 'idle';
    setPhase('desk-settled');
    veil(0);
    apply();
  };
  const reveal = () => {
    if (!bedroom || phase === 'desk-settled' || phase === 'bedroom-reveal') return;
    if (skipped || reducedMotion) { settleDesk(); return; }
    stop();
    const id = epoch;
    segment = 'cover'; clock.value = 0;
    setPhase('bedroom-reveal'); apply();
    const timeline = gsap.timeline();
    animation = timeline;
    timeline.to(clock, { value: 1, duration: 0.7, delay: 0.35, ease: 'power2.inOut',
      onUpdate: guarded(id, apply) });
    timeline.call(guarded(id, () => {
      // Full opaque cover is established before any scene or pose changes.
      veil(1); setLocation('bedroom'); segment = 'uncover'; clock.value = 0; apply();
    }));
    timeline.to(clock, { value: 1, duration: 1.35, ease: 'power2.inOut',
      onUpdate: guarded(id, apply) });
    timeline.call(guarded(id, () => { segment = 'hold'; veil(0); apply(); }));
    timeline.to({}, { duration: 1 });
    timeline.call(guarded(id, () => { segment = 'desk'; clock.value = 0; apply(); }));
    timeline.to(clock, { value: 1, duration: 3, ease: 'power2.inOut',
      onUpdate: guarded(id, apply) });
    timeline.call(guarded(id, settleDesk));
  };
  const arrive = () => {
    segment = 'idle'; clock.value = 1;
    setPhase('window-arrival'); apply();
    if (!arrived) { arrived = true; options.onArrive?.(); }
    if (roomState === 'ready') reveal();
    else if (roomState === 'unavailable') setPhase('bedroom-unavailable');
  };
  const skip = () => {
    skipped = true;
    stop();
    if (roomState === 'ready') settleDesk();
    else { setLocation('exterior'); veil(0); arrive(); }
  };

  refresh();
  run(() => {
    veil(0);
    if (reducedMotion) { arrive(); return; }
    setPhase('exterior-intro'); apply();
    const id = epoch;
    animation = gsap.to(clock, { value: 1, duration: 6, ease: 'power2.inOut',
      onUpdate: guarded(id, apply), onComplete: guarded(id, arrive) });
  });
  return {
    skip() { run(skip); },
    reframe() { run(() => { refresh(); apply(); }); },
    setBedroom(poses) {
      run(() => {
        getBedroom = poses; bedroom = poses(camera.aspect); roomState = 'ready';
        if (skipped || reducedMotion) settleDesk();
        else if (phase !== 'exterior-intro') reveal();
      });
    },
    setBedroomUnavailable() {
      run(() => {
        roomState = 'unavailable';
        if (phase === 'exterior-intro' && !skipped && !reducedMotion) return;
        stop(); segment = 'idle'; setLocation('exterior'); veil(0);
        setPhase('bedroom-unavailable'); apply();
      });
    },
    setReducedMotion(value) {
      run(() => {
        reducedMotion = value;
        if (!value) return;
        stop();
        if (roomState === 'ready') settleDesk();
        else { setLocation('exterior'); veil(0); arrive(); }
      });
    },
    dispose() {
      if (disposed) return;
      stop(); veil(0); disposed = true;
    },
  };
}
