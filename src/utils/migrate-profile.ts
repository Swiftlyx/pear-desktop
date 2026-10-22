import fs from 'node:fs';
import path from 'node:path';

// Rebuilt on demand by Chromium; copying them would only slow the first start
const SKIPPED_DIRECTORIES = new Set([
  'Cache',
  'Code Cache',
  'Crashpad',
  'DawnGraphiteCache',
  'DawnWebGPUCache',
  'GPUCache',
  'GrShaderCache',
  'ShaderCache',
  'blob_storage',
]);

/**
 * Copies a previous profile folder (sign-in session, settings, local storage)
 * into a new one, unless the new one already holds a config. Files that exist
 * in the target are kept. Returns whether a copy was made.
 *
 * config.json is copied last: if copying the rest fails (e.g. files locked by
 * the old app still running), it stays missing and the next call retries.
 */
export const migrateProfile = (legacyDir: string, targetDir: string) => {
  const legacyConfig = path.join(legacyDir, 'config.json');
  const targetConfig = path.join(targetDir, 'config.json');
  if (!fs.existsSync(legacyConfig) || fs.existsSync(targetConfig)) return false;

  fs.cpSync(legacyDir, targetDir, {
    recursive: true,
    force: false,
    filter: (source) =>
      source !== legacyConfig &&
      !SKIPPED_DIRECTORIES.has(path.basename(source)),
  });
  fs.copyFileSync(legacyConfig, targetConfig);
  return true;
};
