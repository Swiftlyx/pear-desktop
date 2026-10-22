import { t } from '@/i18n';
import { createPlugin } from '@/utils';

import style from './style.css?inline';

export default createPlugin({
  name: () => t('plugins.blur-nav-bar.name'),
  description: () => t('plugins.blur-nav-bar.description'),
  restartNeeded: false,
  config: {
    enabled: true,
  },
  renderer: {
    styleSheet: null as CSSStyleSheet | null,

    async start() {
      this.styleSheet = new CSSStyleSheet();
      await this.styleSheet.replace(style);

      document.adoptedStyleSheets = [
        ...document.adoptedStyleSheets,
        this.styleSheet,
      ];
      // Scopes the clear header and the page fading out under it
      document.body.classList.add('blur-nav-bar');
    },
    async stop() {
      await this.styleSheet?.replace('');
      document.body.classList.remove('blur-nav-bar');
    },
  },
});
