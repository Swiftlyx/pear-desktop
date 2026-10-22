import { type BrowserWindow, nativeTheme } from 'electron';
import is from 'electron-is';

import { createBackend } from '@/utils';

import {
  MaterialType,
  WINDOWS_MATERIALS,
  MACOS_MATERIALS,
  type TransparentPlayerConfig,
} from './types';

import type { BackendContext } from '@/types/contexts';

const setWindowTransparency = (window: BrowserWindow, material: MaterialType, opacity: number) => {
  // Background materials are only supported on macOS and Windows
  if (is.windows()) {
    if (WINDOWS_MATERIALS.includes(material)) {
      window.setBackgroundMaterial(
        material as Parameters<BrowserWindow['setBackgroundMaterial']>[0],
      );
    } else {
      window.setBackgroundMaterial('none');
    }
  } else if (is.macOS()) {
    if (MACOS_MATERIALS.includes(material)) {
      window.setVibrancy(
        material as Parameters<BrowserWindow['setVibrancy']>[0],
      );
    } else {
      window.setVibrancy(null);
    }
  }

  // The page paints the tint (see style.css), so a translucent window colour
  // would darken it twice; restore the opaque default when disabled
  window.setBackgroundColor(
    material === MaterialType.NONE && opacity >= 1 ? '#000' : '#00000000',
  );
};

export const backend = createBackend({
  window: null as BrowserWindow | null,
  async start({ window, getConfig }: BackendContext<TransparentPlayerConfig>) {
    const config = await getConfig();
    this.window = window;
    // Materials follow the window theme; a light one under the always dark
    // page would leave white text on a light background
    nativeTheme.themeSource = 'dark';
    setWindowTransparency(window, config.type, config.opacity);
  },
  onConfigChange(newConfig) {
    if (!this.window) return;
    setWindowTransparency(this.window, newConfig.type, newConfig.opacity);
  },
  stop({ window }) {
    setWindowTransparency(window, MaterialType.NONE, 1);
    nativeTheme.themeSource = 'system';
    this.window = null;
  },
});
