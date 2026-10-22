import { app, net } from 'electron';
import { gt, valid } from 'semver';

const LATEST_RELEASE_API =
  'https://api.github.com/repos/Swiftlyx/pear-desktop/releases/latest';

/**
 * Whether the app runs as the portable exe, which electron-updater cannot handle.
 */
export const isPortableBuild = () => !!process.env.PORTABLE_EXECUTABLE_FILE;

/**
 * Asks GitHub for the latest published (non-draft, non-prerelease) release and
 * compares it with the running version. Any failure counts as "no update".
 */
export const isNewerReleaseAvailable = async () => {
  try {
    const response = await net.fetch(LATEST_RELEASE_API, {
      headers: { Accept: 'application/vnd.github+json' },
    });
    if (!response.ok) return false;

    const { tag_name: tag } = (await response.json()) as { tag_name?: string };
    const latest = valid(tag?.replace(/^v/, ''));
    return latest !== null && gt(latest, app.getVersion());
  } catch {
    return false;
  }
};
