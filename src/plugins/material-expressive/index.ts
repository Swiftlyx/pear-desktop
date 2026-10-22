import { t } from '@/i18n';
import { DEFAULT_OPACITY } from '@/plugins/transparent-player/types';
import { createPlugin } from '@/utils';

import {
  applyScheme,
  clearScheme,
  createScheme,
  FALLBACK_SOURCE,
  sourceColorFromUrl,
} from './colors';
import style from './style.css?inline';

import type { VideoDataChanged } from '@/types/video-data-changed';

const ROOT_CLASS = 'pear-m3e';

export default createPlugin({
  name: () => t('plugins.material-expressive.name'),
  description: () => t('plugins.material-expressive.description'),
  // Takes over colours from Album Color Theme, which only steps aside on load
  restartNeeded: true,
  config: {
    enabled: true,
  },
  stylesheets: [style],
  renderer: {
    lastThumbnail: null as string | null,
    onVideoDataChange: null as EventListener | null,

    async start() {
      const root = document.documentElement;
      root.classList.add(ROOT_CLASS);
      applyScheme(createScheme(FALLBACK_SOURCE));

      // Surfaces let the Transparent Player window show through
      let surfaceAlpha = 1;
      if (await window.mainConfig.plugins.isEnabled('transparent-player')) {
        const value: unknown = window.mainConfig.get(
          'plugins.transparent-player.opacity',
        );
        surfaceAlpha =
          typeof value === 'number' && value >= 0 && value <= 1
            ? value
            : DEFAULT_OPACITY;
      }
      root.style.setProperty('--m3e-surface-alpha', `${surfaceAlpha}`);
      root.style.setProperty(
        '--m3e-container-alpha',
        `${surfaceAlpha < 1 ? Math.min(1, surfaceAlpha * 2.5) : 1}`,
      );
    },
    onPlayerApiReady(playerApi) {
      this.onVideoDataChange = ((event: CustomEvent<VideoDataChanged>) => {
        if (event.detail.name !== 'dataloaded') return;
        const thumbnail = playerApi
          .getPlayerResponse()
          ?.videoDetails?.thumbnail?.thumbnails?.at(0)?.url;
        if (!thumbnail || thumbnail === this.lastThumbnail) return;
        this.lastThumbnail = thumbnail;

        sourceColorFromUrl(thumbnail)
          .then((source) => {
            // A newer song may have started while the cover was decoding
            if (this.lastThumbnail === thumbnail) applyScheme(createScheme(source));
          })
          .catch((error: unknown) => console.error(error));
      }) as EventListener;
      document.addEventListener('videodatachange', this.onVideoDataChange);
    },
    stop() {
      if (this.onVideoDataChange) {
        document.removeEventListener('videodatachange', this.onVideoDataChange);
      }
      const root = document.documentElement;
      root.classList.remove(ROOT_CLASS);
      root.style.removeProperty('--m3e-surface-alpha');
      root.style.removeProperty('--m3e-container-alpha');
      clearScheme();
    },
  },
});
