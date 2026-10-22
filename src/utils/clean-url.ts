const VIDEO_HOSTS = ['\u0079\u006f\u0075\u0074\u0075\u0062\u0065.com', '\u0079\u006f\u0075\u0074\u0075.be'];

// `si` links a shared URL to the account that shared it; the rest track the share source
const TRACKING_PARAMS = new Set(['si', 'feature', 'pp']);
const TRACKING_PARAM_PREFIXES = ['utm_'];

const URL_PATTERN = /https?:\/\/[^\s"'<>]+/g;

const isVideoHost = (hostname: string) =>
  VIDEO_HOSTS.some(
    (host) => hostname === host || hostname.endsWith(`.${host}`),
  );

const isTrackingParam = (key: string) =>
  TRACKING_PARAMS.has(key) ||
  TRACKING_PARAM_PREFIXES.some((prefix) => key.startsWith(prefix));

/**
 * Removes account and share-tracking query parameters from a video host URL.
 * Other URLs and URLs without such parameters are returned unchanged.
 */
export const cleanUrl = (url: string): string => {
  const parsed = URL.parse(url);
  if (!parsed || !isVideoHost(parsed.hostname)) return url;

  const trackingKeys = [...parsed.searchParams.keys()].filter(isTrackingParam);
  if (trackingKeys.length === 0) return url;

  for (const key of trackingKeys) {
    parsed.searchParams.delete(key);
  }

  return parsed.toString();
};

/**
 * Applies {@link cleanUrl} to every http(s) URL found in a piece of text.
 */
export const cleanUrlsInText = (text: string): string =>
  text.replace(URL_PATTERN, (url) => cleanUrl(url));
