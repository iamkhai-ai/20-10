import type { StoryPhase } from '../experience/camera-story';

export const storyCopy = {
  loading: 'Đang chuẩn bị khu vườn…',
  queuedSkip: 'Căn phòng sẵn sàng là mình ghé vào nhé…',
  retrying: 'Một chút nữa, căn phòng đang đón nắng…',
  phases: {
    'exterior-intro': 'Đang đến cửa sổ trên lầu…',
    'window-arrival': 'Một chút nữa, căn phòng đang đón nắng…',
    'bedroom-reveal': 'Ghé vào một góc nhỏ đầy nắng…',
    'desk-settled': 'Một chiếc bình tưới đang chờ cạnh chậu cây.',
    'bedroom-unavailable': 'Căn phòng chưa mở được. Mình thử lại nhé.',
  } satisfies Record<StoryPhase, string>,
};

export interface IntroControls {
  setStatus(message: string): void;
  setRetryVisible(visible: boolean): void;
  setVeil(opacity: number): void;
  setSettled(settled: boolean): void;
  dispose(): void;
}

export function createIntroControls(onSkip: () => void, onRetry?: () => void): IntroControls {
  const ui = document.querySelector<HTMLElement>('#ui');
  const status = document.querySelector<HTMLElement>('#status');
  if (status) status.tabIndex = -1;
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = 'Bỏ qua phần mở đầu';
  button.addEventListener('click', onSkip);
  const retry = document.createElement('button');
  retry.type = 'button';
  retry.textContent = 'Thử mở căn phòng lại';
  retry.hidden = true;
  if (onRetry) retry.addEventListener('click', onRetry);
  const veil = document.createElement('div');
  veil.id = 'transition-veil';
  veil.setAttribute('aria-hidden', 'true');
  document.body.appendChild(veil);
  ui?.append(button, retry);
  const hide = (element: HTMLButtonElement, hidden: boolean) => {
    if (hidden && document.activeElement === element) status?.focus({ preventScroll: true });
    element.hidden = hidden;
  };
  return {
    setStatus(message) { if (status) status.textContent = message; },
    setRetryVisible(visible) { hide(retry, !visible || !onRetry); },
    setVeil(opacity) { veil.style.opacity = String(Math.max(0, Math.min(1, opacity))); },
    setSettled(settled) { hide(button, settled); },
    dispose() {
      button.removeEventListener('click', onSkip);
      if (onRetry) retry.removeEventListener('click', onRetry);
      button.remove(); retry.remove(); veil.remove();
    },
  };
}
