export type WateringMode = 'none' | 'drag' | 'button';
export type WateringPhase = 'unavailable' | 'ready' | 'aiming' | 'watering' | 'paused' | 'complete';
export interface WateringSnapshot {
  phase: WateringPhase;
  mode: WateringMode;
  available: boolean;
  elapsedMs: number;
  progress: number;
  complete: boolean;
}
export interface WateringState {
  setAvailable(available: boolean, now: number): void;
  setAction(mode: WateringMode, now: number): void;
  setAim(valid: boolean, now: number): void;
  advance(now: number): Readonly<WateringSnapshot>;
  pause(now: number): void;
  snapshot(): Readonly<WateringSnapshot>;
  dispose(): void;
}

/** One monotonic clock and one input owner; only the preceding eligible interval counts. */
export function createWateringState(onComplete?: () => void): WateringState {
  const state: WateringSnapshot = {
    phase: 'unavailable', mode: 'none', available: false,
    elapsedMs: 0, progress: 0, complete: false,
  };
  let baseline: number | null = null;
  let aimed = false;
  let disposed = false;
  const eligible = () => state.available && state.mode !== 'none' && aimed && !state.complete;
  const refresh = () => {
    state.phase = state.complete ? 'complete' : !state.available ? 'unavailable' :
      eligible() ? 'watering' : state.mode !== 'none' ? 'aiming' : state.elapsedMs ? 'paused' : 'ready';
    state.progress = state.elapsedMs / 5000;
  };
  const advance = (now: number) => {
    if (disposed || !Number.isFinite(now)) return state;
    const time = baseline === null ? now : Math.max(now, baseline);
    if (baseline !== null && eligible()) state.elapsedMs = Math.min(5000, state.elapsedMs + time - baseline);
    baseline = time;
    if (!state.complete && state.elapsedMs >= 5000) {
      state.complete = true;
      state.mode = 'none';
      aimed = false;
      refresh();
      onComplete?.();
    } else refresh();
    return state;
  };
  const pause = (now: number) => {
    if (disposed) return;
    advance(now);
    state.mode = 'none'; aimed = false; refresh();
  };
  return {
    advance,
    snapshot: () => state,
    setAvailable(value, now) {
      if (disposed) return;
      advance(now);
      state.available = value;
      if (!value) { state.mode = 'none'; aimed = false; }
      refresh();
    },
    setAction(mode, now) {
      if (disposed) return;
      advance(now);
      if (!state.available || state.complete) return;
      if (state.mode !== mode) aimed = false;
      state.mode = mode;
      if (mode === 'none') aimed = false;
      refresh();
    },
    setAim(valid, now) {
      if (disposed) return;
      advance(now);
      aimed = valid && state.available && state.mode !== 'none' && !state.complete;
      refresh();
    },
    pause,
    dispose() {
      if (disposed) return;
      disposed = true; state.available = false; state.mode = 'none'; aimed = false; baseline = null; refresh();
    },
  };
}
