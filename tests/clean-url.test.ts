import { expect, test } from '@playwright/test';

import { cleanUrl, cleanUrlsInText } from '../src/utils/clean-url';

const musicHost = 'https://music.youtube.com';
const shortHost = 'https://youtu.be';

test('cleanUrl strips account and share-tracking parameters', () => {
  expect(cleanUrl(`${musicHost}/watch?v=abc&si=r_aY6-tDqF`)).toBe(
    `${musicHost}/watch?v=abc`,
  );
  expect(cleanUrl(`${musicHost}/watch?v=abc&si=x&t=42`)).toBe(
    `${musicHost}/watch?v=abc&t=42`,
  );
  expect(cleanUrl(`${musicHost}/playlist?list=PL123&si=zzz`)).toBe(
    `${musicHost}/playlist?list=PL123`,
  );
  expect(cleanUrl(`${shortHost}/abc?si=xyz`)).toBe(`${shortHost}/abc`);
  expect(
    cleanUrl(`${musicHost}/watch?v=abc&feature=share&pp=ygU&utm_source=x`),
  ).toBe(`${musicHost}/watch?v=abc`);
});

test('cleanUrl leaves other URLs and text untouched', () => {
  expect(cleanUrl(`${musicHost}/watch?v=abc`)).toBe(`${musicHost}/watch?v=abc`);
  expect(cleanUrl('https://example.com/?si=keep')).toBe(
    'https://example.com/?si=keep',
  );
  expect(cleanUrl('not a url')).toBe('not a url');
});

test('cleanUrlsInText cleans every link in a text', () => {
  expect(
    cleanUrlsInText(
      `Listen: ${musicHost}/watch?v=a&si=b and ${shortHost}/c?si=d`,
    ),
  ).toBe(`Listen: ${musicHost}/watch?v=a and ${shortHost}/c`);
});
