import { t } from '@/i18n';
import { createPlugin } from '@/utils';
import { cleanUrlsInText } from '@/utils/clean-url';

const SHARE_URL_INPUT_SELECTOR = 'yt-copy-link-renderer input#share-url';

const getCopiedText = (event: ClipboardEvent) => {
  const target = event.composedPath()[0];
  if (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement
  ) {
    const { selectionStart, selectionEnd, value } = target;
    if (selectionStart === null || selectionEnd === null) return value;
    return value.slice(selectionStart, selectionEnd);
  }

  return document.getSelection()?.toString() ?? '';
};

// Covers the share dialog "Copy" button (execCommand) and manual Ctrl+C
const onCopy = (event: ClipboardEvent) => {
  const text = getCopiedText(event);
  if (!text || !event.clipboardData) return;

  const cleanText = cleanUrlsInText(text);
  if (cleanText === text) return;

  event.clipboardData.setData('text/plain', cleanText);
  event.preventDefault();
};

// Shows the clean link in the share dialog, so what is displayed matches what is copied
const cleanShareUrlInputs = () => {
  for (const input of document.querySelectorAll<HTMLInputElement>(
    SHARE_URL_INPUT_SELECTOR,
  )) {
    const cleanValue = cleanUrlsInText(input.value);
    if (cleanValue !== input.value) input.value = cleanValue;
  }
};

export default createPlugin({
  name: () => t('plugins.link-sanitizer.name'),
  description: () => t('plugins.link-sanitizer.description'),
  restartNeeded: false,
  config: {
    enabled: true,
  },
  renderer: {
    shareDialogObserver: null as MutationObserver | null,

    start() {
      document.addEventListener('copy', onCopy, true);

      // Own-property override; removing it in stop() restores Clipboard.prototype.writeText
      const { clipboard } = navigator;
      const writeText = clipboard.writeText.bind(clipboard);
      clipboard.writeText = (text: string) => writeText(cleanUrlsInText(text));
    },
    onPlayerApiReady() {
      // Share dialogs are rendered inside the popup container; observing only
      // that subtree keeps the observer cheap
      const popupContainer =
        document.querySelector('ytmusic-popup-container') ?? document.body;

      this.shareDialogObserver?.disconnect();
      this.shareDialogObserver = new MutationObserver(() => {
        cleanShareUrlInputs();
        // YTM may rewrite the input value after toggling "Start at"
        requestAnimationFrame(cleanShareUrlInputs);
      });
      this.shareDialogObserver.observe(popupContainer, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['aria-checked', 'checked', 'hidden', 'opened'],
      });
    },
    stop() {
      document.removeEventListener('copy', onCopy, true);
      Reflect.deleteProperty(navigator.clipboard, 'writeText');

      this.shareDialogObserver?.disconnect();
      this.shareDialogObserver = null;
    },
  },
});
