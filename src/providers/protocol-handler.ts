import path from 'node:path';

import { app, type BrowserWindow } from 'electron';

import { getSongControls } from './song-controls';

export const APP_PROTOCOL =
  '\u0079\u006f\u0075\u0074\u0075\u0062\u0065\u006d\u0075\u0073\u0069\u0063';

let protocolHandler: ((cmd: string, ...args: string[]) => void) | undefined;

export function setupProtocolHandler(win: BrowserWindow) {
  if (process.defaultApp && process.argv.length >= 2) {
    app.setAsDefaultProtocolClient(APP_PROTOCOL, process.execPath, [
      path.resolve(process.argv[1]),
    ]);
  } else {
    app.setAsDefaultProtocolClient(APP_PROTOCOL);
  }

  const songControls = getSongControls(win);

  protocolHandler = ((cmd: keyof typeof songControls, ...args) => {
    if (PROTOCOL_COMMANDS.has(cmd)) {
      // @ts-expect-error: cmd is a key of songControls
      songControls[cmd](...args);
    }
  }) as (cmd: string, ...args: string[]) => void;
}

// Any website can open a protocol link, so only plain playback controls are
// exposed (no likes, queue edits or searches on behalf of the account)
const PROTOCOL_COMMANDS: ReadonlySet<string> = new Set<
  keyof ReturnType<typeof getSongControls>
>(['previous', 'next', 'play', 'pause', 'playPause']);

export function handleProtocol(cmd: string, ...args: string[]) {
  protocolHandler?.(cmd, ...args);
}

export function changeProtocolHandler(
  f: (cmd: string, ...args: string[]) => void,
) {
  protocolHandler = f;
}
