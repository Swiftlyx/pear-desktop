import '@total-typescript/ts-reset';

import type * as config from './config/preload';
import type { t } from '@/i18n';
import type { VideoDataChanged } from '@/types/video-data-changed';
import type { ipcRenderer as electronIpcRenderer } from 'electron';
import type is from 'electron-is';
import type { trustedTypes } from 'trusted-types';

declare global {
  interface DocumentEventMap {
    'videodatachange': CustomEvent<VideoDataChanged>;
  }

  interface Window {
    trustedTypes?: typeof trustedTypes;
    ipcRenderer: typeof electronIpcRenderer;
    mainConfig: typeof config;
    electronIs: typeof is;
    ELECTRON_RENDERER_URL: string | undefined;
    /**
     * Internal variable (Last interaction time)
     */
    _lact: number;
    navigation: Navigation;
    download: () => void;
    reload: () => void;
    i18n: {
      t: typeof t;
    };
  }
}
