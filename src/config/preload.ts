// Read-only config for the sandboxed preload (and, through contextBridge, the renderer).
// The store lives in the main process: the preload fetches a snapshot once and
// replaces it on every `peard:config-updated` broadcast.
// Plugin config writes go through the `peard:set-config` IPC handler.

import { deepmerge } from 'deepmerge-ts';
import { ipcRenderer } from 'electron';
import { allPlugins } from 'virtual:plugins';

import type * as mainConfig from './index';
import type { PluginConfig } from '@/types/plugins';

export { defaultConfig } from './defaults';

let snapshot: Record<string, unknown> | undefined;

ipcRenderer.on(
  'peard:config-updated',
  (_, newConfig: Record<string, unknown>) => {
    snapshot = newConfig;
  },
);

const getSnapshot = () =>
  (snapshot ??= ipcRenderer.sendSync('peard:get-config-snapshot') as Record<
    string,
    unknown
  >);

// Same dot-path lookup as the main store; values are cloned so callers cannot mutate the snapshot
export const get = ((key: string) => {
  let value: unknown = getSnapshot();
  for (const part of key.split('.')) {
    if (typeof value !== 'object' || value === null) return undefined;
    value = (value as Record<string, unknown>)[part];
  }
  return structuredClone(value);
}) as unknown as typeof mainConfig.get;

const getPlugins = () => (get('plugins') ?? {}) as Record<string, PluginConfig>;

export const plugins = {
  getPlugins,
  getOptions: <T>(plugin: string) => getPlugins()[plugin] as T,
  async isEnabled(plugin: string) {
    const pluginConfig = deepmerge(
      (await allPlugins())[plugin]?.config ?? { enabled: false },
      getPlugins()[plugin] ?? {},
    );
    return pluginConfig.enabled;
  },
};
