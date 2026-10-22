// Domains the main window may display (the player itself plus the Google sign-in flow).
// Everything else is opened in the default browser instead.
const TRUSTED_DOMAINS = ['youtube.com', 'google.com'];

const isTrustedDomain = (hostname: string) =>
  TRUSTED_DOMAINS.some(
    (domain) => hostname === domain || hostname.endsWith(`.${domain}`),
  );

/**
 * Whether a URL may be loaded inside the app window.
 */
export const isTrustedAppUrl = (url: string) => {
  const parsed = URL.parse(url);
  if (!parsed) return false;
  if (parsed.protocol === 'file:') return true;

  return parsed.protocol === 'https:' && isTrustedDomain(parsed.hostname);
};

/**
 * Whether a URL is safe to hand over to the default browser.
 */
export const isExternalWebUrl = (url: string) => {
  const protocol = URL.parse(url)?.protocol;
  return protocol === 'https:' || protocol === 'http:';
};
