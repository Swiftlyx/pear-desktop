import { expect, test } from '@playwright/test';

import { isSameSong, normalizeForMatch } from './matching';

const song = (title: string, artist: string, alternativeTitle?: string) => ({
  title,
  artist,
  alternativeTitle,
});

test('normalizeForMatch strips catalog decorations', () => {
  expect(normalizeForMatch('One More Time (Radio Edit)')).toBe('one more time');
  expect(normalizeForMatch('Get Lucky - Radio Edit')).toBe('get lucky');
  expect(normalizeForMatch('Beyoncé')).toBe('beyonce');
  // Both sides are folded the same way, so й -> и is fine for matching
  expect(normalizeForMatch('Червоний мак')).toBe('червонии мак');
});

test('isSameSong accepts the same track from another catalog', () => {
  expect(
    isSameSong(song('One More Time', 'Daft Punk'), {
      title: 'One More Time (Radio Edit)',
      artists: ['Daft Punk'],
    }),
  ).toBe(true);
  expect(
    isSameSong(song('Get Lucky', 'Daft Punk & Pharrell Williams'), {
      title: 'Get Lucky (feat. Pharrell Williams & Nile Rodgers)',
      artists: ['Daft Punk'],
    }),
  ).toBe(true);
  expect(
    isSameSong(song('Shape of You (Acoustic)', 'Ed Sheeran', 'Shape of You'), {
      title: 'Shape of You',
      artists: ['Ed Sheeran'],
    }),
  ).toBe(true);
});

test('isSameSong rejects decoys and unrelated hits', () => {
  // Musixmatch decoy returned for instrumentals and unknown tracks
  expect(
    isSameSong(song('Reflections', 'Daft Punk'), {
      title: 'NOKIA',
      artists: ['Drake'],
    }),
  ).toBe(false);
  // Same title, different artist
  expect(
    isSameSong(song('Paradise', 'Daft Punk'), {
      title: 'Paradise',
      artists: ['Coldplay'],
    }),
  ).toBe(false);
  // Same artist, different song
  expect(
    isSameSong(song('Veridis Quo', 'Daft Punk'), {
      title: 'Digital Love',
      artists: ['Daft Punk'],
    }),
  ).toBe(false);
});
