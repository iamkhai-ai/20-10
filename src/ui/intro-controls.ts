export interface IntroControls {
  setStatus(message: string): void;
  dispose(): void;
}

export function createIntroControls(onSkip: () => void): IntroControls {
  const ui = document.querySelector<HTMLElement>('#ui');
  const status = document.querySelector<HTMLElement>('#status');
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = 'Bỏ qua phần mở đầu';
  button.addEventListener('click', onSkip);
  if (ui) ui.appendChild(button);

  return {
    setStatus(message: string) {
      if (status) status.textContent = message;
    },
    dispose() {
      button.removeEventListener('click', onSkip);
      button.remove();
    },
  };
}
