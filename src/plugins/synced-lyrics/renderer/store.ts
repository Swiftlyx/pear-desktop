import { createMemo, runWithOwner } from 'solid-js';
import { createStore } from 'solid-js/store';

import { getSongInfo } from '@/providers/song-info-front';

import { reactiveOwner } from './reactive-root';

import {
  type ProviderName,
  providerNames,
  type ProviderState,
} from '../providers';
import { providers } from '../providers/renderer';

import type { LyricProvider } from '../types';
import type { SongInfo } from '@/providers/song-info';

type LyricsStore = {
  provider: ProviderName;
  current: ProviderState;
  lyrics: Record<ProviderName, ProviderState>;
};

const initialData = () =>
  providerNames.reduce(
    (acc, name) => {
      acc[name] = { state: 'fetching', data: null, error: null };
      return acc;
    },
    {} as LyricsStore['lyrics'],
  );

export const [lyricsStore, setLyricsStore] = createStore<LyricsStore>({
  provider: providerNames[0],
  lyrics: initialData(),
  get current(): ProviderState {
    return this.lyrics[this.provider];
  },
});

export const currentLyrics = runWithOwner(reactiveOwner, () =>
  createMemo(() => {
    const provider = lyricsStore.provider;
    return lyricsStore.lyrics[provider];
  }),
)!;

type VideoId = string;

type SearchCacheData = Record<ProviderName, ProviderState>;
interface SearchCache {
  state: 'loading' | 'done';
  data: SearchCacheData;
  settled?: Promise<void>;
}

// A provider that never answers would otherwise keep its song "loading" forever
const PROVIDER_TIMEOUT_MS = 20_000;

const withTimeout = <T>(promise: Promise<T>, providerName: string) =>
  Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error(`${providerName} timed out`)),
        PROVIDER_TIMEOUT_MS,
      ),
    ),
  ]);

// Keeps the results of the most recent songs only; a radio session would
// otherwise hold every song's lyrics from every provider for the app's lifetime
const MAX_CACHED_SONGS = 50;

// TODO: Maybe use localStorage for the cache.
const searchCache = new Map<VideoId, SearchCache>();

const rememberSearch = (videoId: VideoId, cache: SearchCache) => {
  // Re-insert so the Map's insertion order doubles as recency order
  searchCache.delete(videoId);
  searchCache.set(videoId, cache);

  for (const oldest of searchCache.keys()) {
    if (searchCache.size <= MAX_CACHED_SONGS) break;
    searchCache.delete(oldest);
  }
};
export const fetchLyrics = (info: SongInfo) => {
  if (searchCache.has(info.videoId)) {
    const cache = searchCache.get(info.videoId)!;

    if (cache.state === 'loading') {
      cache.settled?.then(() => fetchLyrics(info));
      return;
    }

    if (getSongInfo().videoId === info.videoId) {
      setLyricsStore('lyrics', () => {
        // weird bug with solid-js
        return JSON.parse(JSON.stringify(cache.data)) as typeof cache.data;
      });
    }

    return;
  }

  const cache: SearchCache = {
    state: 'loading',
    data: initialData(),
  };

  rememberSearch(info.videoId, cache);
  if (getSongInfo().videoId === info.videoId) {
    setLyricsStore('lyrics', () => {
      // weird bug with solid-js
      return JSON.parse(JSON.stringify(cache.data)) as typeof cache.data;
    });
  }

  const tasks: Promise<void>[] = [];

  // prettier-ignore
  for (
    const [providerName, provider] of Object.entries(providers) as [
    ProviderName,
    LyricProvider,
  ][]
    ) {
    const pCache = cache.data[providerName];

    tasks.push(
      withTimeout(provider.search(info), providerName)
        .then((res) => {
          pCache.state = 'done';
          pCache.data = res;

          if (getSongInfo().videoId === info.videoId) {
            setLyricsStore('lyrics', (old) => {
              return {
                ...old,
                [providerName]: {
                  state: 'done',
                  data: res ? { ...res } : null,
                  error: null,
                },
              };
            });
          }
        })
        .catch((error: Error) => {
          pCache.state = 'error';
          pCache.error = error;

          console.error(error);

          if (getSongInfo().videoId === info.videoId) {
            setLyricsStore('lyrics', (old) => {
              return {
                ...old,
                [providerName]: { state: 'error', error, data: null },
              };
            });
          }
        }),
    );
  }

  cache.settled = Promise.allSettled(tasks).then(() => {
    cache.state = 'done';
    rememberSearch(info.videoId, cache);
  });
};

export const retrySearch = (provider: ProviderName, info: SongInfo) => {
  setLyricsStore('lyrics', (old) => {
    const pCache = {
      state: 'fetching',
      data: null,
      error: null,
    };

    return {
      ...old,
      [provider]: pCache,
    };
  });

  providers[provider]
    .search(info)
    .then((res) => {
      setLyricsStore('lyrics', (old) => {
        return {
          ...old,
          [provider]: { state: 'done', data: res, error: null },
        };
      });
    })
    .catch((error) => {
      setLyricsStore('lyrics', (old) => {
        return {
          ...old,
          [provider]: { state: 'error', data: null, error },
        };
      });
    });
};
