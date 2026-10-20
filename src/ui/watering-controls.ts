import type { WateringSnapshot } from '../experience/watering-state';

export const wateringCopy = {
  instruction: 'Kéo bình đến chậu, hoặc chọn “Tưới cây”.',
  start: 'Tưới cây', pause: 'Tạm dừng', finished: 'Đã tưới đủ',
  aiming: 'Đưa vòi bình vào chậu nhé.',
  watering: 'Một chút nước cho mầm cây…',
  paused: 'Mình tưới tiếp từ đây nhé.',
  complete: 'Cây đã đủ nước rồi.',
  unavailable: 'Chưa thể cầm bình. Bạn thử tải lại trang nhé.',
};
export interface WateringControls {
  setVisible(visible: boolean): void;
  render(snapshot: Readonly<WateringSnapshot>): void;
  dispose(): void;
}

export function createWateringControls(options: {
  onToggle: () => void; onPause: () => void;
}): WateringControls {
  const host = document.querySelector('#ui');
  const status = document.querySelector<HTMLElement>('#status');
  if (!host || !status) throw new Error('Watering controls require the existing UI shell.');
  status.tabIndex = -1;
  const panel = document.createElement('section'); panel.id = 'watering-panel'; panel.hidden = true;
  panel.setAttribute('aria-label', 'Chăm sóc mầm cây');
  const hint = document.createElement('p'); hint.id = 'watering-hint'; hint.textContent = wateringCopy.instruction;
  const row = document.createElement('div'); row.className = 'watering-progress-row';
  const label = document.createElement('label'); label.htmlFor = 'watering-progress'; label.textContent = 'Nước cho cây';
  const amount = document.createElement('span'); amount.id = 'watering-amount'; amount.setAttribute('aria-hidden', 'true');
  row.append(label, amount);
  const progress = document.createElement('progress'); progress.id = 'watering-progress'; progress.max = 5; progress.value = 0;
  const button = document.createElement('button'); button.id = 'watering-action'; button.type = 'button';
  button.textContent = wateringCopy.start; button.setAttribute('aria-pressed', 'false'); button.setAttribute('aria-describedby', hint.id);
  const repeat = (event: KeyboardEvent) => {
    if (event.repeat && (event.key === 'Enter' || event.key === ' ')) event.preventDefault();
  };
  button.addEventListener('click', options.onToggle);
  button.addEventListener('blur', options.onPause);
  button.addEventListener('keydown', repeat);
  panel.append(hint, row, progress, button); host.append(panel);
  let disposed = false, lastAnnouncement = '';
  const focusStatus = () => { if (panel.contains(document.activeElement)) status.focus({ preventScroll: true }); };
  return {
    setVisible(visible) {
      if (disposed) return;
      if (!visible) focusStatus();
      panel.hidden = !visible;
    },
    render(snapshot) {
      if (disposed) return;
      const { phase, elapsedMs, mode, complete } = snapshot;
      progress.value = elapsedMs / 1000;
      const coarse = Math.floor(elapsedMs / 1000);
      progress.setAttribute('aria-valuetext', `${coarse} trên 5 giây`);
      const text = `${(elapsedMs / 1000).toFixed(1)} / 5 giây`;
      if (amount.textContent !== text) amount.textContent = text;
      const active = mode === 'button' && !complete;
      const name = complete ? wateringCopy.finished : active ? wateringCopy.pause : wateringCopy.start;
      if (button.textContent !== name) button.textContent = name;
      button.setAttribute('aria-pressed', String(active));
      if (complete && !button.disabled) { focusStatus(); button.disabled = true; }
      const announcement = `${phase}:${coarse}`;
      if (announcement === lastAnnouncement) return;
      lastAnnouncement = announcement;
      const message = phase === 'complete' ? wateringCopy.complete : phase === 'paused' ? wateringCopy.paused :
        phase === 'aiming' ? wateringCopy.aiming : phase === 'watering' ?
          `${wateringCopy.watering} ${coarse} / 5 giây.` : null;
      if (message && status.textContent !== message) status.textContent = message;
    },
    dispose() {
      if (disposed) return;
      focusStatus(); disposed = true;
      button.removeEventListener('click', options.onToggle); button.removeEventListener('blur', options.onPause);
      button.removeEventListener('keydown', repeat); panel.remove();
    },
  };
}
