import { t } from '@/i18n';
import { createPlugin } from '@/utils';

import { backend } from './backend';
import { onMenu } from './menu';
import style from './style.css?inline';
import { MaterialType, type TransparentPlayerConfig } from './types';

// The page world of the sandboxed renderer has no `process`
const isWindows =
  typeof process !== 'undefined' && process.platform
    ? process.platform === 'win32'
    : /windows/i.test(globalThis.navigator?.userAgent ?? '');

// On by default only where the acrylic material exists (Windows)
const defaultConfig: TransparentPlayerConfig = {
  enabled: isWindows,
  opacity: 0.1,
  type: isWindows ? MaterialType.ACRYLIC : MaterialType.NONE,
};

export default createPlugin({
  name: () => t('plugins.transparent-player.name'),
  description: () => t('plugins.transparent-player.description'),
  addedVersion: '3.11.x',
  restartNeeded: true,
  config: defaultConfig,
  stylesheets: [style],
  menu: onMenu,
  backend,
  renderer: {
    props: {
      enabled: defaultConfig.enabled,
      opacity: defaultConfig.opacity,
      type: defaultConfig.type,
    } as TransparentPlayerConfig,
    async start({ getConfig }) {
      const config = await getConfig();
      this.props = config;
      if (config.enabled) {
        document.body.classList.add(
          'transparent-background-color',
          'transparent-player',
        );

        if (await window.mainConfig.plugins.isEnabled('album-color-theme')) {
          document.body.classList.add('transparent-player-album-tint');
        }
        this.applyVariables();
      }
    },
    onConfigChange(newConfig) {
      this.props = newConfig;
      this.applyVariables();
    },
    stop() {
      document.body.classList.remove(
        'transparent-background-color',
        'transparent-player',
        'transparent-player-album-tint',
      );
      document.documentElement.style.removeProperty(
        '--ytmd-transparent-player-opacity',
      );
    },
    applyVariables(this: { props: TransparentPlayerConfig }) {
      const { opacity } = this.props;
      document.documentElement.style.setProperty(
        '--ytmd-transparent-player-opacity',
        opacity.toString(),
      );
    },
  },
});
