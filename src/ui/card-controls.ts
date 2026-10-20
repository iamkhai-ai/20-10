import { giftMessage, bloomCopy } from '../content/gift-message';

export interface CardControls {
  setReady(value: boolean): void;
  open(): void;
  dispose(): void;
}

export function createCardControls(): CardControls {
  const host = document.querySelector('#ui');
  const status = document.querySelector<HTMLElement>('#status');
  if (!host || !status) throw new Error('Card controls require the UI shell.');
  const panel = document.createElement('section'); panel.id = 'card-panel'; panel.hidden = true;
  panel.setAttribute('aria-label', 'Tấm thiệp của bạn');
  const hint = document.createElement('p'); hint.textContent = bloomCopy.hint;
  const button = document.createElement('button'); button.type = 'button'; button.id = 'card-action';
  button.textContent = bloomCopy.open; button.setAttribute('aria-haspopup', 'dialog');
  const dialog = document.createElement('dialog'); dialog.id = 'gift-dialog';
  dialog.setAttribute('aria-labelledby', 'gift-title');
  const book = document.createElement('div'); book.className = 'gift-book';
  const cover = document.createElement('aside'); cover.className = 'gift-cover'; cover.setAttribute('aria-hidden', 'true');
  const coverDate = document.createElement('p'); coverDate.className = 'gift-cover-date'; coverDate.textContent = giftMessage.date;
  const illustration = document.createElement('img'); illustration.src = '/art/tulip-botanical.svg'; illustration.alt = '';
  illustration.width = 260; illustration.height = 360;
  const coverTitle = document.createElement('p'); coverTitle.className = 'gift-cover-title'; coverTitle.textContent = giftMessage.coverTitle;
  const seal = document.createElement('span'); seal.className = 'gift-seal'; seal.textContent = '✿';
  cover.append(coverDate, illustration, coverTitle, seal);
  const page = document.createElement('article'); page.className = 'gift-paper';
  const date = document.createElement('p'); date.className = 'gift-date'; date.textContent = giftMessage.date;
  const title = document.createElement('h2'); title.id = 'gift-title'; title.textContent = giftMessage.title;
  title.tabIndex = -1;
  const salutation = document.createElement('p'); salutation.className = 'gift-salutation'; salutation.textContent = giftMessage.salutation;
  const body = document.createElement('div'); body.className = 'gift-letter';
  for (const text of giftMessage.paragraphs) {
    const paragraph = document.createElement('p'); paragraph.textContent = text; body.append(paragraph);
  }
  const close = document.createElement('button'); close.type = 'button'; close.textContent = bloomCopy.close;
  page.append(date, title, salutation, body, close); book.append(cover, page); dialog.append(book);
  panel.append(hint, button); host.append(panel); document.body.append(dialog);
  let ready = false, disposed = false;
  const open = () => {
    if (ready && !disposed && !dialog.open) {
      dialog.showModal(); title.focus({ preventScroll: true }); dialog.scrollTop = 0;
    }
  };
  const closeDialog = () => dialog.close();
  const restore = () => { if (!disposed) (ready ? button : status).focus({ preventScroll: true }); };
  const repeat = (event: KeyboardEvent) => {
    if (event.repeat && (event.key === 'Enter' || event.key === ' ')) event.preventDefault();
  };
  button.addEventListener('click', open); button.addEventListener('keydown', repeat);
  close.addEventListener('click', closeDialog); dialog.addEventListener('close', restore);
  return {
    open,
    setReady(value) {
      if (disposed) return;
      ready = value;
      if (!value && (panel.contains(document.activeElement) || dialog.open)) {
        if (dialog.open) dialog.close(); status.tabIndex = -1; status.focus({ preventScroll: true });
      }
      panel.hidden = !value;
    },
    dispose() {
      if (disposed) return;
      if (panel.contains(document.activeElement) || dialog.open) { status.tabIndex = -1; status.focus({ preventScroll: true }); }
      disposed = true;
      button.removeEventListener('click', open); button.removeEventListener('keydown', repeat);
      close.removeEventListener('click', closeDialog); dialog.removeEventListener('close', restore);
      if (dialog.open) dialog.close(); panel.remove(); dialog.remove();
    },
  };
}
