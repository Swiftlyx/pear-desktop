# Pear Desktop — Swiftlyx fork

A leaner, fixed and hardened fork of [pear-devs/pear-desktop](https://github.com/pear-devs/pear-desktop),
a desktop music player with plugins.

An independent project, not affiliated with, authorized or endorsed by Google LLC.

## How it differs from upstream

**Plugins.** 19 instead of 40: the ones that work and are worth keeping. On by default: Album Color Theme, Blur Navigation Bar, Discord, Downloader, In-App Menu, Link Sanitizer, Material 3 Expressive, Navigation, Performance Improvement, Playlist Reorder, Precise Volume, Prefer Song, Synced Lyrics, Taskbar Media Control and Transparent Player (Windows and macOS).

| Plugin | Notes |
|---|---|
| Album Color Theme, Blur Navigation Bar, Discord, Downloader, In-App Menu, Navigation, Performance Improvement, Precise Volume, Synced Lyrics, Taskbar Media Control, Unobtrusive Player, Video Toggle | From upstream, with the fixes below |
| Do Not Track | Ad/tracker blocker, off by default; filter list index pinned in the source |
| Transparent Player | On by default: mica on Windows, native vibrancy on macOS. Reworked: one even tint, content clipped under the header (with Blur Navigation Bar it blurs and fades there instead), readable menus; no stale frames on macOS/Linux |
| **Link Sanitizer** (new) | Strips the account-bound `si` and share tracking (`feature`, `pp`, `utm_*`) from shared and copied links |
| **Playlist Reorder** (new) | Move a song to the top or bottom of your own playlist in one click |
| **Material 3 Expressive** (new) | The whole app in Material 3 Expressive: a dynamic colour scheme from the current cover (Material colour utilities), shape morphing, spring motion and the Inter typeface (OFL); translucent surfaces with Transparent Player |
| **Prefer Song**, **Audio Only** | From [michei69/pear-desktop](https://github.com/michei69/pear-desktop): song instead of music video |

**Fixes**
- Unobtrusive Player left the player page open but invisible, so it could not be expanded.
- Synced Lyrics showed the same made-up lyrics ("Wob gopini den…") for many songs: Musixmatch answers
  unknown tracks with a decoy. Every hit is now checked against the playing song, Musixmatch uses its
  working mobile API, and the lyrics cache is capped (it used to grow for the whole session).
- Player setup could run twice and register every handler twice; plugins could hang until a song played.
- Precise Volume works with the new player UI.
- Memory and lifecycle fixes across plugins (listeners and observers released on disable).
- Performance Improvement kept the page redrawing on every display frame (about a third of a CPU core
  even when idle); Synced Lyrics kept animating under a closed player page and repainted its glow on
  every frame. Idle CPU dropped from 39% to 2.5% of a core, playback with lyrics from 42% to 15%.
- Long playlists scrolled with stutters: In-App Menu made the browser track the visibility of every
  element inside every row. Now about half the layout work and no hitches on repeat scrolls.
- The seek bar of the new player bar only reacted to a 3px line; the whole 23px strip seeks now.
- In-App Menu: the sidebar no longer starts under the header, and the empty scrollbar strip on the
  right is gone. Scrollbars are thin and translucent everywhere.

**Security**
- Electron 44 (upstream ships 42, now out of support) and no known vulnerable dependencies.
- Chromium sandbox enabled for the page.
- Only the player and Google sign-in pages load inside the app; other links open in your browser.
- Google sign-in pages keep their Content-Security-Policy.
- Cookies are encrypted on disk; `RunAsNode`, `NODE_OPTIONS` and `--inspect` are disabled.
- `peardesktop://` links can only control playback; the lyrics network helper only reaches Musixmatch.

**Other**
- English and Ukrainian only.
- Releases for Windows (x64, arm64: web installer and portable) and macOS on Apple Silicon.
- Update notifications also work in the portable and macOS builds.

## Install

Download the latest build from [Releases](https://github.com/Swiftlyx/pear-desktop/releases/latest):
`Pear-Desktop-Web-Setup-<version>.exe` (installer) or `Pear-Desktop-<version>-x64-portable.exe` /
`-arm64-portable.exe` on Windows, `Pear-Desktop-<version>-arm64.dmg` on a Mac with Apple Silicon.

Coming from a build released under the previous app name? The first start copies your old profile
(sign-in, settings) over automatically; the old folder is kept as a backup.

The macOS build is not signed. After moving it to Applications, run once:

```bash
xattr -cr "/Applications/Pear Desktop.app"
```

## Build

Node.js 24 LTS and pnpm 11.

```bash
pnpm install
pnpm dev                 # run from source
pnpm dist:win:portable   # portable Windows exe in ./pack
pnpm dist:mac            # Apple Silicon dmg (on macOS)
```

Checks: `pnpm lint`, `pnpm typecheck`, `pnpm test`.

To release, bump `version` in `package.json`, then push a matching tag (`git tag v3.12.2 && git push --tags`).
GitHub Actions builds Windows and macOS packages into a draft release.

## Sync with upstream

```bash
git fetch upstream
git merge upstream/master
# keep files this fork removed (translations, dropped plugins) deleted
git status --porcelain | awk '/^DU / {print $2}' | xargs -r git rm -q
```

## Credits

- [th-ch](https://github.com/th-ch) and the [pear-devs](https://github.com/pear-devs/pear-desktop)
  contributors, for the app this fork is built on.
- [Mikey (michei69)](https://github.com/michei69) and the contributors of
  [michei69/pear-desktop](https://github.com/michei69/pear-desktop), whose work is included here:
  - Prefer Song by [omarcinkonis](https://github.com/omarcinkonis), Audio Only by
    [EmreSoyak](https://github.com/EmreSoyak)
  - Codebase audit, Musixmatch mobile API, Taskbar like/dislike buttons, player setup and Synced Lyrics
    fixes by Mikey (with Kairo)
  - Precise Volume support for the new player UI by [WoWfff](https://github.com/WoWfff)
  - In-App Menu performance by [gothmiku](https://github.com/gothmiku)
  - Built-in lyrics without the third-party proxy by Volodymyr Tymchenko
  - Album Color Theme home page fix by [Chaganti-Reddy](https://github.com/Chaganti-Reddy) and
    Navigation cleanup by Mykhailo Balaker

## License

MIT, see [license](license).
