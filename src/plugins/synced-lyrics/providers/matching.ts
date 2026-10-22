import { jaroWinkler } from '@skyra/jaro-winkler';

import type { SearchSongInfo } from '../types';

const MIN_SIMILARITY = 0.85;

/**
 * Lowercases and strips what differs between catalogs for the same track:
 * diacritics, "(feat. X)" / "[Remastered]" groups, " - Radio Edit" suffixes and punctuation.
 */
export const normalizeForMatch = (text: string) =>
  text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s*[([][^)\]]*[)\]]\s*/g, ' ')
    .replace(/\s+-\s+.*$/, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();

const splitArtists = (artists: string) =>
  artists
    .split(/[&,]|\s(?:feat\.?|ft\.?|with|x)\s/i)
    .map(normalizeForMatch)
    .filter(Boolean);

const isSimilar = (a: string, b: string) =>
  a === b || jaroWinkler(a, b) >= MIN_SIMILARITY;

/**
 * Whether a provider's search hit is the song that is playing.
 * Providers fall back to unrelated tracks when nothing matches (Musixmatch even
 * returns a decoy track with made-up lyrics), so every hit must be checked.
 */
export const isSameSong = (
  song: Pick<SearchSongInfo, 'title' | 'alternativeTitle' | 'artist'>,
  candidate: { title: string; artists: string[] },
) => {
  const candidateTitle = normalizeForMatch(candidate.title);
  const titleMatches = [song.title, song.alternativeTitle]
    .filter((title): title is string => !!title)
    .map(normalizeForMatch)
    .some(
      (title) => title && candidateTitle && isSimilar(title, candidateTitle),
    );
  if (!titleMatches) return false;

  const songArtists = splitArtists(song.artist);
  const candidateArtists = candidate.artists.flatMap(splitArtists);
  return songArtists.some((artist) =>
    candidateArtists.some((other) => isSimilar(artist, other)),
  );
};
