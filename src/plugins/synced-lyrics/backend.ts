import { net } from 'electron';

import { createBackend } from '@/utils';

// The page can reach this handler, so only lyrics providers that need
// forbidden headers are allowed; anything else would be an open proxy
const ALLOWED_HOST_SUFFIX = '.musixmatch.com';

const handlers = {
  // Note: This will only be used for Forbidden headers, e.g. User-Agent, Authority, Cookie, etc.
  // See: https://developer.mozilla.org/en-US/docs/Glossary/Forbidden_request_header
  async fetch(
    url: string,
    init: RequestInit,
  ): Promise<[number, string, Record<string, string>]> {
    const parsed = URL.parse(url);
    if (
      parsed?.protocol !== 'https:' ||
      !parsed.hostname.endsWith(ALLOWED_HOST_SUFFIX)
    ) {
      throw new Error(`synced-lyrics: refusing to fetch ${url}`);
    }

    const res = await net.fetch(url, init);
    return [
      res.status,
      await res.text(),
      Object.fromEntries(res.headers.entries()),
    ];
  },
};

export const backend = createBackend({
  start(ctx) {
    ctx.ipc.handle('synced-lyrics:fetch', (url: string, init: RequestInit) =>
      handlers.fetch(url, init),
    );
  },
  stop(ctx) {
    ctx.ipc.removeHandler('synced-lyrics:fetch');
  },
});
