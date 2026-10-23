import {
  argbFromHex,
  argbFromRgb,
  Hct,
  hexFromArgb,
  QuantizerCelebi,
  SchemeContent,
  SchemeMonochrome,
  Score,
  Variant,
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

/** A cover's theme colour; null when it has none (black and white covers) */
export type SourceColor = number | null;

// Score's answer when no colour is fit for a theme. Its own default is Google
// blue, which turned black and white covers blue; quantized colours are
// opaque, so 0 never collides with one.
const NO_SOURCE = 0;

// The Content scheme keeps the source hue for the primary roles, which is
// what Material recommends for colour taken from media artwork. Covers
// without colour get the Monochrome scheme: greys only.
export const createScheme = (source: SourceColor): DynamicScheme =>
  source === null
    ? new SchemeMonochrome(Hct.fromInt(FALLBACK_SOURCE), true, 0, '2025')
    : new SchemeContent(Hct.fromInt(source), true, 0, '2025');

export const sourceColorFromUrl = async (url: string): Promise<SourceColor> => {
  const image = new Image();
  image.crossOrigin = 'anonymous';
  image.src = url;
  await image.decode();

  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Could not get canvas context');
  context.drawImage(image, 0, 0);
  const bytes = context.getImageData(0, 0, canvas.width, canvas.height).data;

  // Same pipeline as sourceColorFromImage, with a fallback that can be told apart
  const pixels: number[] = [];
  for (let i = 0; i < bytes.length; i += 4) {
    if (bytes[i + 3] === 255) {
      pixels.push(argbFromRgb(bytes[i], bytes[i + 1], bytes[i + 2]));
    }
  }
  const [best] = Score.score(QuantizerCelebi.quantize(pixels, 128), {
    desired: 1,
    fallbackColorARGB: NO_SOURCE,
  });
  return best === NO_SOURCE ? null : best;
};

const kebab = (role: string) =>
  role.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);

/** How strongly the surfaces take on the cover's colour (plugin menu) */
export type ColourStrength = 'subtle' | 'medium' | 'strong' | 'vivid';

export const COLOUR_STRENGTHS: ColourStrength[] = [
  'subtle',
  'medium',
  'strong',
  'vivid',
];

// Share of the cover's chroma given to the surfaces; subtle keeps the
// scheme's own. Tones stay, so contrast with the text on them stays too.
const SURFACE_CHROMA: Record<ColourStrength, number> = {
  subtle: 0,
  medium: 0.25,
  strong: 0.4,
  vivid: 0.6,
};

const SURFACE_ROLES = new Set<string>([
  'surface',
  'surfaceDim',
  'surfaceBright',
  'surfaceContainerLowest',
  'surfaceContainerLow',
  'surfaceContainer',
  'surfaceContainerHigh',
  'surfaceContainerHighest',
]);

export const applyScheme = (
  scheme: DynamicScheme,
  strength: ColourStrength = 'subtle',
) => {
  const { style } = document.documentElement;
  const source = scheme.sourceColorHct;
  // Black and white covers keep their greys
  const chroma =
    scheme.variant === Variant.MONOCHROME
      ? 0
      : source.chroma * SURFACE_CHROMA[strength];

  for (const role of ROLES) {
    let argb = scheme[role];
    if (chroma && SURFACE_ROLES.has(role)) {
      const hct = Hct.fromInt(argb);
      argb = Hct.from(source.hue, Math.max(hct.chroma, chroma), hct.tone).toInt();
    }
    style.setProperty(`--md-sys-color-${kebab(role)}`, hexFromArgb(argb));
  }
};

export const clearScheme = () => {
  const { style } = document.documentElement;
  for (const role of ROLES) style.removeProperty(`--md-sys-color-${kebab(role)}`);
};
