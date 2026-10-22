// Drop-in replacement for `electron-is` in the preload bundle (aliased in electron.vite.config.mts).
// The original requires Node's `os`, which a sandboxed preload cannot load.
// Members never use `this`, so they keep working after contextBridge copies the object.

const isDev =
  'ELECTRON_IS_DEV' in process.env
    ? Number.parseInt(process.env.ELECTRON_IS_DEV ?? '', 10) === 1
    : /node_modules[\\/]electron[\\/]/.test(process.execPath);

// Compares a requested OS release with `process.getSystemVersion()`, part by part
const compareRelease = (requested: string) => {
  const actual = process.getSystemVersion().split('.').map(Number);
  const parts = requested.split('.').map(Number);
  for (const [index, part] of parts.entries()) {
    const diff = part - (actual[index] ?? 0);
    if (diff !== 0) return Math.sign(diff);
  }
  return 0;
};

const osx = () => process.platform === 'darwin';

export default {
  renderer: () => process.type === 'renderer',
  main: () => process.type === 'browser',
  osx,
  macOS: osx,
  windows: () => process.platform === 'win32',
  linux: () => process.platform === 'linux',
  freebsd: () => process.platform === 'freebsd',
  x86: () => process.arch === 'ia32',
  x64: () => process.arch === 'x64',
  production: () => !isDev,
  dev: () => isDev,
  sandbox: () => 'APP_SANDBOX_CONTAINER_ID' in process.env,
  mas: () => process.mas === true,
  windowsStore: () => process.windowsStore === true,
  all: (...checks: (() => boolean)[]) =>
    checks.length ? checks.every((check) => check()) : undefined,
  none: (...checks: (() => boolean)[]) =>
    checks.length ? !checks.some((check) => check()) : undefined,
  one: (...checks: (() => boolean)[]) =>
    checks.length ? checks.some((check) => check()) : undefined,
  release: (requested: string) => compareRelease(requested) === 0,
  gtRelease: (requested: string) => compareRelease(requested) > 0,
  ltRelease: (requested: string) => compareRelease(requested) < 0,
};
