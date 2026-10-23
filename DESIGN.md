# Design system

Rules every visual change in this fork follows. Material 3 Expressive
(`src/plugins/material-expressive/`) is the source of truth; Transparent Player
and Blur Navigation Bar adapt it to the clear window. Check a change against
this list before building, and extend the list when a new rule is settled.

## Colour

- The scheme grows from the current cover: `SchemeContent` (dark, spec 2025).
  A cover with no colour fit for a theme (black and white) gets
  `SchemeMonochrome`: greys only, never the library's blue fallback. Until the
  first cover is read, the source is `#ff0033`.
- Components use roles (`--md-sys-color-*`, written by `colors.ts`) or the
  tokens derived from them (`--m3e-*`), never literal colours. The site's own
  tokens (`--yt-sys-color-baseline--*`, `--ytmusic-*`, `--yt-spec-*`) are
  mapped onto roles in one place, at the top of `style.css`.
- "Cover colour strength" (menu: subtle, medium, strong, vivid; default
  medium) gives the surface roles a share of the cover's chroma at their own
  tones, so they take on the cover's colour while contrast with the text on
  them stays. Black and white covers stay grey.
- Every role used in CSS is registered with `@property` (`<color>`), so the
  next song's scheme fades in (600 ms). A role newly used in CSS is
  registered too.
- Transparent window: one clear surface. Title bar, header, page, drawer and
  player bar paint nothing; no panels, bands or edges between them, before
  or after scrolling. The seek bar is the only separator of the player bar.
- Opaque window: header and page share `--m3e-surface`. With "separate
  panels" on (menu, default on) the title bar, the drawer and the player bar
  sit on `--m3e-frame` (surface-container-lowest, a few tones darker), so
  they read as panels of their own; off, everything is one surface. No band where
  the header meets the page. Page artwork (cover glows) stays off: it
  starts under the header and turns it into a panel.
- Containers: menus, dialogs and cards use the surface-container roles.
  Parts the site draws separately that belong together (the search field and
  its suggestions) become one panel: one background, outer corners only.
  Menus that scroll show a thin pill over their right edge, inside the menu
  (no native scrollbar: it always takes a column of its own), moved by a
  scroll timeline and hidden when the menu does not scroll. In
  the transparent window, overlays that sit on content (menus, dialogs, search
  suggestions) use `--ytmd-transparent-player-overlay-background` (dense).
- Accents: primary for the main action (Play), the seek bar and the active
  tab; secondary-container / on-secondary-container for selection (current
  drawer item, current queue row, selected segment, liked); tertiary only at
  the end of the progress gradient.
- Text: on-surface for primary text, on-surface-variant for secondary text
  and for icons in rows.

## Shape

- Corner scale (`--md-sys-shape-corner-*`): 4, 8, 12, 16, 20, 28, full.
- Covers in rows and the queue 8, rows 12, artwork cards 16 (28 on hover),
  page header art and the player 28, menus 16, dialogs 28, chips 8, buttons
  full. Round avatars stay round.
- Grouped controls (Song/Video, like/dislike, any segmented control) keep one
  outer shape in every state: selecting or pressing changes colour, never
  corners. Connected groups: 2 px gap, 4 px inner corners; a pill track has a
  pill indicator.
- Play: round, a rounded square (30 %) while playing, 22 % while pressed;
  proportional radii keep the shape at every size. It never shows a spinner
  or a loading shape of its own.
- Overlays on images reach 1 px past the image on every side (radius + 1).
  With equal edges the image's edge pixels show through as a light rim or
  dots, however the two are clipped: an overlay that fades is a layer of its
  own, and layers are anti-aliased separately.
- Outlines are `outline` with a -1 px offset (or a border), never an inset
  box-shadow: its corners leave stray pixels next to a rounded background.
- Hover on artwork morphs its shape: square artwork rounds (16 to 28 px),
  artist circles square towards a squircle (50 % to 36 %).

## Outlines and dividers

- No dividers between rows: rows are separated by space (a line under a
  rounded row bends up at its corners). No borders on the drawer, header or
  player bar.
- Buttons and chips carry no outline: they sit on the neutral tonal
  container (see States). A 1 px `outline-variant` is only for quiet borders
  of containers. A dark fill reads as a hole in the clear window.

## States

- Secondary buttons, chips and button groups (every outlined site button:
  More, Play all, Show all, Mix, Subscribe; genre chips, carousel arrows,
  like/dislike) are neutral tonal: `--m3e-neutral-container` (on-surface
  10 %, 16 % on hover), no outline; disabled ones keep a 4 % container and a
  38 % icon. Arrows that belong together form one connected capsule.
- Hover is the state layer `--m3e-state-hover` (on-surface 8 %), pressed is
  `--m3e-state-pressed` (10 %). Every row, segment, chip and button shows
  hover.
- A hover area is larger than its content: rows keep at least 6 px above and
  below the cover. Where rows sit flush, they grow into the gaps with padding
  taken back by negative margins, so nothing moves; a clipping parent (the
  shelf scroller, the carousel) grows for real so the outer rows stay whole.
- Icons in a row share one colour: on-surface-variant, on-surface on hover.
  Controls added by plugins follow it.
- Press effects take the shape of their control: the site's ripple and
  touch feedback elements (`yt-interaction`, `yt-touch-feedback-shape`) get
  `border-radius: inherit`, never their own circle.
- Focus rings use the secondary role, never the site's blue.
- Anything that acts on a click shows the pointer cursor (queue rows play on
  click).

## Motion

- Scroll-driven animations pass their timeline through a custom property
  (`animation-timeline: var(--x)`): the minifier folds a literal `view()` into
  the `animation` shorthand, where browsers reject it.
- Springs as `linear()` curves: fast spatial (360 ms) for shape changes,
  default effects (231 ms) for colour, fast effects (150 ms) for state layers.
- Large surfaces animate only compositor properties: opacity and transform.
  No animated clip-path, mask, filter or layout on pages (an animated clip on
  the player page made it stutter). Scroll-driven blur is for small elements
  only (rows, chip rows, shelf titles, lyric lines).
- Page transitions fade with a small scale or rise (M3 fade through / shared
  axis): enter up to 350 ms with emphasized decelerate, exit up to 150 ms with
  emphasized accelerate. Nothing may pass visibly under the clear player bar.

- Something that sits at a fractional position and whose colours animate
  (they follow the scheme) can leave stale anti-aliased pixels just outside
  its rounded corners: repaints cover its box, not the 1 px the edge bleeds
  into. Give it a layer of its own (`will-change: transform`); DevTools
  screenshots do not show these pixels, only a capture of the window does.

## Transparent window

- backdrop-filter cannot blur in the clear window (it only darkens): never
  rely on it, and reset it explicitly where a plugin sets it with a stronger
  selector.
- Images that extend under clear chrome (artist header photos) fade out at
  those edges and darken themselves instead of carrying an overlay.
- Content under clear chrome fades out instead: Blur Navigation Bar's mask
  gradient on `#content` plus a scroll-driven `view()` blur on vertical rows;
  lyric lines fade the same way under the provider picker. The opaque window
  uses the same look. View timelines bind to the nearest scroller, so items in
  horizontal carousels only fade.

## Typography

- The site's own fonts (Roboto, YouTube Sans); a replacement was tried and
  rejected. Times use tabular figures.

## Checking a change

- Build the portable and look at it in the real window, with Transparent
  Player on and off. Screenshots taken through DevTools do not show the window
  material; capture the window itself.
- Bands and edges: read the pixel brightness down one column of a scrolled
  capture; it must not step at the header or bar edges.
- Hover: force it with DevTools (`CSS.forcePseudoState`); bringing the window
  forward resets synthetic hover to the real cursor.
