import { t } from '@/i18n';
import { createPlugin } from '@/utils';

import { backend } from './backend';
import { onMenu } from './menu';
import style from './style.css?inline';
import {
  DEFAULT_OPACITY,
  MaterialType,
  type TransparentPlayerConfig,
} from './types';

// The page world of the sandboxed renderer has no `process`
const platform =
  typeof process !== 'undefined' && process.platform
    ? process.platform
    : /windows/i.test(globalThis.navigator?.userAgent ?? '')
      ? 'win32'
      : /macintosh/i.test(globalThis.navigator?.userAgent ?? '')
        ? 'darwin'
        : 'linux';

// On by default where the system has a native material: mica on Windows,
// the window-background vibrancy on macOS
const defaultType: Partial<Record<string, MaterialType>> = {
  win32: MaterialType.MICA,
  darwin: MaterialType.UNDER_WINDOW,
};

const defaultConfig: TransparentPlayerConfig = {
  enabled: platform in defaultType,
  opacity: DEFAULT_OPACITY,
  type: defaultType[platform] ?? MaterialType.NONE,
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

        // Material 3 Expressive takes over from Album Color Theme: no page
        // artwork, so the header and the page share the window material
        if (
          (await window.mainConfig.plugins.isEnabled('album-color-theme')) &&
          !(await window.mainConfig.plugins.isEnabled('material-expressive'))
        ) {
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
