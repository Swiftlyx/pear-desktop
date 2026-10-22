import {
  argbFromHex,
  Hct,
  hexFromArgb,
  SchemeContent,
  sourceColorFromImage,
  type DynamicScheme,
} from '@material/material-color-utilities';

// Colour roles written as --md-sys-color-* custom properties
const ROLES = [
  'primary',
  'onPrimary',
  'primaryContainer',
  'onPrimaryContainer',
  'secondary',
  'onSecondary',
  'secondaryContainer',
  'onSecondaryContainer',
  'tertiary',
  'onTertiary',
  'tertiaryContainer',
  'onTertiaryContainer',
  'error',
  'surface',
  'surfaceDim',
  'surfaceBright',
  'surfaceContainerLowest',
  'surfaceContainerLow',
  'surfaceContainer',
  'surfaceContainerHigh',
  'surfaceContainerHighest',
  'onSurface',
  'onSurfaceVariant',
  'outline',
  'outlineVariant',
  'inverseSurface',
  'inverseOnSurface',
  'inversePrimary',
] as const;

// Until the first cover is read the scheme grows from the brand red
export const FALLBACK_SOURCE = argbFromHex('#ff0033');

// The Content scheme keeps the source hue for the primary roles, which is
// what Material recommends for colour taken from media artwork
export const createScheme = (source: number): DynamicScheme =>
  new SchemeContent(Hct.fromInt(source), true, 0, '2025');

export const sourceColorFromUrl = async (url: string) => {
  const image = new Image();
  image.crossOrigin = 'anonymous';
  image.src = url;
  await image.decode();
  return sourceColorFromImage(image);
};

const kebab = (role: string) =>
  role.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);

export const applyScheme = (scheme: DynamicScheme) => {
  const { style } = document.documentElement;
  for (const role of ROLES) {
    style.setProperty(`--md-sys-color-${kebab(role)}`, hexFromArgb(scheme[role]));
  }
};

export const clearScheme = () => {
  const { style } = document.documentElement;
  for (const role of ROLES) style.removeProperty(`--md-sys-color-${kebab(role)}`);
};
