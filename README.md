# Pear Desktop — personal fork

A trimmed and hardened fork of [pear-devs/pear-desktop](https://github.com/pear-devs/pear-desktop),
the desktop wrapper for YouTube Music with plugins.

This project is not affiliated with, authorized or endorsed by Google LLC or YouTube.
"Google" and "YouTube Music" are trademarks of their respective owners.

## What is different from upstream

- **Only the plugins that are actually used are kept:** Album Color Theme, Blur Navigation Bar,
  Discord Rich Presence, Do Not Track (ad/tracker blocker, off by default), Downloader,
  In-App Menu, Link Sanitizer, Navigation, Performance Improvement, Precise Volume,
  Synced Lyrics, Unobtrusive Player. The other 30 plugins and their dependencies are removed.
- **English only.** Translations and the language menu are removed.
- **Unobtrusive Player fix.** YouTube Music now renders a second, hidden player bar. The plugin
  clicked its toggle, so the player page stayed open but invisible and could not be expanded.
- **Link Sanitizer (new, on by default).** Removes the account-bound `si` parameter and share
  tracking (`feature`, `pp`, `utm_*`) from the share dialog, from every copy to the clipboard and
  from *Navigation → Copy current URL*.
- **Security hardening**
  - Electron 44 (42 is out of support).
  - Only YouTube/Google pages can be loaded in the app window. Popups, links and redirects to other
    sites open in the default browser, so they never get the app's IPC bridge.
  - The Content-Security-Policy is removed from the player only. Google sign-in pages keep theirs.
  - Electron fuses: cookies are encrypted at rest, `RunAsNode`, `NODE_OPTIONS` and `--inspect` are
    disabled, and only the integrity-checked `app.asar` is loaded.
  - The Synced Lyrics network helper is limited to Musixmatch (it used to proxy any URL, including
    `localhost`).
  - `youtubemusic://` protocol links can only control playback (no likes, queue edits or searches).
  - The Do Not Track filter list index is pinned in the source instead of being downloaded from a
    third-party repository.
- **Less work at runtime.** Audio is no longer routed through a Web Audio graph that only the
  removed equalizer/visualizer plugins needed, and the renderer bundle shrank from 6.5 MB to 3.8 MB.

## Build

Requirements: Node.js 24 LTS (or 22.22+ / 26+) and pnpm 11 (`npm install -g pnpm@11`).

```bash
pnpm install
pnpm dev              # run from source with hot reload
pnpm dist:win:portable  # build the portable Windows exe into ./pack
pnpm dist:win          # Windows web installer + portable (x64, ia32, arm64)
pnpm dist:mac          # macOS dmg (run on macOS)
pnpm dist:linux        # AppImage, deb, rpm, snap, flatpak, tar.gz (run on Linux)
```

Checks: `pnpm lint`, `pnpm typecheck`, `pnpm playwright test clean-url matching lrc`.

## Release

1. Bump `version` in `package.json` and commit.
2. Tag and push: `git tag v3.12.1 && git push origin master --tags`.
3. GitHub Actions builds Windows, macOS and Linux packages, like upstream, and uploads them to a
   **draft** release. Publish the draft on GitHub.

## Sync with upstream

```bash
git fetch upstream
git merge upstream/master
```

Upstream keeps updating translations and the removed plugins, so a merge usually reports
modify/delete conflicts for those files. Keep them deleted:

```bash
git status --porcelain | awk '/^DU / {print $2}' | xargs -r git rm -q
```

Resolve any remaining conflicts, then run the checks above before committing.

## License

MIT. Original work © th-ch and the pear-devs contributors, see [license](license).
