import { createEffect, createSignal, runWithOwner } from 'solid-js';

import { createRenderer } from '@/utils';
import { waitForElement } from '@/utils/wait-for-element';

import { disposeReactiveRoot, reactiveOwner } from './reactive-root';
import { isVisible, setConfig, setCurrentTime } from './renderer';
import { fetchLyrics } from './store';
import { selectors, tabStates } from './utils';

import type { SyncedLyricsPluginConfig } from '../types';
import type { SongInfo } from '@/providers/song-info';
import type { RendererContext } from '@/types/contexts';
import type { MusicPlayer } from '@/types/music-player';

export let _ytAPI: MusicPlayer | null = null;
export let netFetch: (
  url: string,
  init?: RequestInit,
) => Promise<[number, string, Record<string, string>]>;

const [isPlayerPageOpen, setIsPlayerPageOpen] = createSignal(false);
const [isPageVisible, setIsPageVisible] = createSignal(!document.hidden);

let clock: ReturnType<typeof setInterval> | undefined;

const tick = () => setCurrentTime((_ytAPI?.getCurrentTime() ?? 0) * 1000);

// Each tick can move the current line and restart its animations, which
// costs style and layout work even under a closed player page, so the clock
// only runs while the lyrics are on screen.
const setClockRunning = (running: boolean) => {
  if (running && !clock) {
    tick();
    clock = setInterval(tick, 100);
  } else if (!running && clock) {
    clearInterval(clock);
    clock = undefined;
  }
};

const onVisibilityChange = () => setIsPageVisible(!document.hidden);

export const renderer = createRenderer<
  {
    observerCallback: MutationCallback;
    observer?: MutationObserver;
    layoutObserver?: MutationObserver;
    videoDataChange: () => Promise<void>;
  },
  SyncedLyricsPluginConfig
>({
  onConfigChange(newConfig) {
    setConfig(newConfig);
  },

  observerCallback(mutations: MutationRecord[]) {
    for (const mutation of mutations) {
      const header = mutation.target as HTMLElement;

      switch (mutation.attributeName) {
        case 'disabled':
          header.removeAttribute('disabled');
          break;
        case 'aria-selected':
          tabStates[header.ariaSelected ?? 'false']();
          break;
      }
    }
  },

  async onPlayerApiReady(api: MusicPlayer) {
    _ytAPI = api;

    const layout = await waitForElement<HTMLElement>('ytmusic-app-layout');
    const syncPlayerPage = () =>
      setIsPlayerPageOpen(layout.hasAttribute('player-page-open'));
    this.layoutObserver ??= new MutationObserver(syncPlayerPage);
    this.layoutObserver.observe(layout, {
      attributes: true,
      attributeFilter: ['player-page-open'],
    });
    syncPlayerPage();

    document.addEventListener('visibilitychange', onVisibilityChange);

    runWithOwner(reactiveOwner, () => {
      createEffect(() =>
        setClockRunning(isVisible() && isPlayerPageOpen() && isPageVisible()),
      );
    });

    api.addEventListener('videodatachange', this.videoDataChange);

    await this.videoDataChange();
  },
  async videoDataChange() {
    // prettier-ignore
    this.observer ??= new MutationObserver(this.observerCallback);
    this.observer.disconnect();

    // Force the lyrics tab to be enabled at all times.
    const header = await waitForElement<HTMLElement>(selectors.head);
    {
      header.removeAttribute('disabled');
      tabStates[header.ariaSelected ?? 'false']();
    }

    this.observer.observe(header, { attributes: true });
    header.removeAttribute('disabled');
  },

  async start(ctx: RendererContext<SyncedLyricsPluginConfig>) {
    netFetch = ctx.ipc.invoke.bind(ctx.ipc, 'synced-lyrics:fetch');

    setConfig(await ctx.getConfig());

    ctx.ipc.on('peard:update-song-info', (info: SongInfo) => {
      fetchLyrics(info);
    });
  },

  stop() {
    setClockRunning(false);
    this.layoutObserver?.disconnect();
    document.removeEventListener('visibilitychange', onVisibilityChange);
    disposeReactiveRoot();
  },
});
