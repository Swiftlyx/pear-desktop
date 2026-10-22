import path from 'node:path';

import { app } from 'electron';

import { migrateProfile } from '@/utils/migrate-profile';

// Profile folder of the builds released before the rename to Pear Desktop
const LEGACY_PROFILE_NAME =
  'YouTube Music';

/**
 * Brings the previous profile over on the first start under the new name.
 * Imported first by the main entry, before anything opens the config store,
 * and only for the default profile location, so `--user-data-dir` runs are
 * left alone. The old folder is kept as a backup.
 */
const migrateUserData = () => {
  const appData = app.getPath('appData');
  const userData = app.getPath('userData');
  const legacyUserData = path.join(appData, LEGACY_PROFILE_NAME);

  if (path.dirname(userData) !== appData || userData === legacyUserData) return;

  try {
    if (migrateProfile(legacyUserData, userData)) {
      console.log(`Migrated the previous profile from ${legacyUserData}`);
    }
  } catch (error) {
    console.error('Failed to migrate the previous profile', error);
  }
};

migrateUserData();
