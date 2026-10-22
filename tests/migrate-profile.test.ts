import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { expect, test } from '@playwright/test';

import { migrateProfile } from '../src/utils/migrate-profile';

const makeLegacyProfile = () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pear-migrate-'));
  const legacy = path.join(root, 'legacy');
  fs.mkdirSync(path.join(legacy, 'Network'), { recursive: true });
  fs.mkdirSync(path.join(legacy, 'Cache', 'Cache_Data'), { recursive: true });
  fs.writeFileSync(
    path.join(legacy, 'config.json'),
    '{"options":{"tray":true}}',
  );
  fs.writeFileSync(path.join(legacy, 'Local State'), '{"os_crypt":{}}');
  fs.writeFileSync(path.join(legacy, 'Network', 'Cookies'), 'cookies');
  fs.writeFileSync(path.join(legacy, 'Cache', 'Cache_Data', 'data_0'), 'cache');
  return { root, legacy, target: path.join(root, 'target') };
};

test('copies the session and settings but not the caches', () => {
  const { root, legacy, target } = makeLegacyProfile();

  expect(migrateProfile(legacy, target)).toBe(true);
  expect(fs.readFileSync(path.join(target, 'config.json'), 'utf8')).toContain(
    'tray',
  );
  expect(fs.existsSync(path.join(target, 'Local State'))).toBe(true);
  expect(fs.readFileSync(path.join(target, 'Network', 'Cookies'), 'utf8')).toBe(
    'cookies',
  );
  expect(fs.existsSync(path.join(target, 'Cache'))).toBe(false);
  // The old profile stays as a backup
  expect(fs.existsSync(path.join(legacy, 'config.json'))).toBe(true);

  fs.rmSync(root, { recursive: true, force: true });
});

test('runs once: an existing config is never overwritten', () => {
  const { root, legacy, target } = makeLegacyProfile();
  fs.mkdirSync(target, { recursive: true });
  fs.writeFileSync(
    path.join(target, 'config.json'),
    '{"options":{"tray":false}}',
  );

  expect(migrateProfile(legacy, target)).toBe(false);
  expect(fs.readFileSync(path.join(target, 'config.json'), 'utf8')).toContain(
    'false',
  );
  expect(fs.existsSync(path.join(target, 'Network'))).toBe(false);

  fs.rmSync(root, { recursive: true, force: true });
});

test('does nothing without a previous profile', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pear-migrate-'));

  expect(
    migrateProfile(path.join(root, 'missing'), path.join(root, 'target')),
  ).toBe(false);
  expect(fs.existsSync(path.join(root, 'target'))).toBe(false);

  fs.rmSync(root, { recursive: true, force: true });
});
