import { t } from '@/i18n';
import { createPlugin } from '@/utils';

import style from './style.css?inline';

export default createPlugin({
  name: () => t('plugins.modern-design.name'),
  description: () => t('plugins.modern-design.description'),
  restartNeeded: false,
  config: {
    enabled: true,
  },
  stylesheets: [style],
  renderer: {
    start() {
      document.body.classList.add('modern-design');
    },
    stop() {
      document.body.classList.remove('modern-design');
    },
  },
});
