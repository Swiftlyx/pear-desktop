import { t } from '@/i18n';
import { createPlugin } from '@/utils';

import style from './style.css?inline';

import type { MusicPlayerAppElement } from '@/types/music-player-app-element';

type Position = 'top' | 'bottom';

interface PlaylistEditEndpoint {
  playlistId?: string;
  actions?: { action?: string }[];
}

interface RowData {
  playlistItemData?: { playlistSetVideoId?: string };
  menu?: {
    menuRenderer?: {
      items?: Record<
        string,
        { serviceEndpoint?: { playlistEditEndpoint?: PlaylistEditEndpoint } }
      >[];
    };
  };
}

type RowElement = HTMLElement & { data?: RowData };
type ShelfElement = HTMLElement & {
  data?: {
    playlistId?: string;
    contents?: { musicResponsiveListItemRenderer?: RowData }[];
  };
};

const SHELF_SELECTOR = 'ytmusic-playlist-shelf-renderer';
const ROW_SELECTOR = `${SHELF_SELECTOR} ytmusic-responsive-list-item-renderer`;
const BUTTONS_CLASS = 'pear-playlist-reorder';

const ICON_PATHS: Record<Position, string> = {
  top: 'M8 11h3v10h2V11h3l-4-4-4 4zM4 3v2h16V3H4z',
  bottom: 'M16 13h-3V3h-2v10H8l4 4 4-4zM4 19v2h16v-2H4z',
};

// Only rows of the user's own playlists offer "Remove from playlist", which
// is the only reliable marker that the playlist can be edited
const isEditableRow = (data?: RowData) =>
  (data?.menu?.menuRenderer?.items ?? []).some((item) =>
    Object.values(item).some((renderer) =>
      renderer?.serviceEndpoint?.playlistEditEndpoint?.actions?.some(
        ({ action }) => action === 'ACTION_REMOVE_VIDEO',
      ),
    ),
  );

const getSetVideoId = (data?: RowData) =>
  data?.playlistItemData?.playlistSetVideoId;

// Mirrors the server-side move in the rendered list; YTM re-renders the rows
// from the shelf data, so continuations and row state stay consistent
const moveInShelf = (
  shelf: ShelfElement,
  setVideoId: string,
  position: Position,
) => {
  const contents = [...(shelf.data?.contents ?? [])];
  const index = contents.findIndex(
    (item) =>
      getSetVideoId(item.musicResponsiveListItemRenderer) === setVideoId,
  );
  if (index === -1) return;

  const [item] = contents.splice(index, 1);
  if (position === 'top') contents.unshift(item);
  else contents.push(item);

  shelf.data = { ...shelf.data, contents };
};

const moveRow = async (row: RowElement, position: Position) => {
  const shelf = row.closest<ShelfElement>(SHELF_SELECTOR);
  const app = document.querySelector<MusicPlayerAppElement>('ytmusic-app');
  const setVideoId = getSetVideoId(row.data);
  const playlistId = shelf?.data?.playlistId;
  if (!shelf || !app || !setVideoId || !playlistId) return;

  const action: Record<string, string> = {
    action: 'ACTION_MOVE_VIDEO_BEFORE',
    setVideoId,
  };

  // Without a successor the item is moved to the end of the playlist
  if (position === 'top') {
    const firstSetVideoId = getSetVideoId(
      shelf.data?.contents?.[0]?.musicResponsiveListItemRenderer,
    );
    if (!firstSetVideoId || firstSetVideoId === setVideoId) return;
    action.movedSetVideoIdSuccessor = firstSetVideoId;
  }

  const result = await app.networkManager.fetch<
    { status?: string },
    { playlistId: string; actions: Record<string, string>[] }
  >('/browse/edit_playlist', { playlistId, actions: [action] });

  if (result?.status !== 'STATUS_SUCCEEDED') {
    throw new Error(`Failed to move playlist item: ${JSON.stringify(result)}`);
  }

  moveInShelf(shelf, setVideoId, position);
};

const createButton = (position: Position) => {
  const button = document.createElement('button');
  button.type = 'button';
  button.dataset.position = position;
  const label = t(`plugins.playlist-reorder.button.${position}`);
  button.title = label;
  button.ariaLabel = label;

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', ICON_PATHS[position]);
  svg.append(path);
  button.append(svg);

  return button;
};

const decorateRow = (row: RowElement) => {
  const existing = row.querySelector(`.${BUTTONS_CLASS}`);
  const editable = isEditableRow(row.data);

  // Rows are recycled when the list re-renders, so re-check on every pass
  if (!editable) {
    existing?.remove();
    return;
  }
  if (existing) return;

  const menu = row.querySelector('ytmusic-menu-renderer.menu');
  if (!menu?.parentElement) return;

  const container = document.createElement('div');
  container.className = BUTTONS_CLASS;
  container.append(createButton('top'), createButton('bottom'));
  menu.parentElement.insertBefore(container, menu);
};

const decorateAllRows = () => {
  for (const row of document.querySelectorAll<RowElement>(ROW_SELECTOR)) {
    decorateRow(row);
  }
};

const onClick = (event: MouseEvent) => {
  const button = (event.target as Element | null)?.closest<HTMLButtonElement>(
    `.${BUTTONS_CLASS} button`,
  );
  if (!button) return;

  // Keep YTM from treating the click as "play this row"
  event.preventDefault();
  event.stopPropagation();

  const row = button.closest<RowElement>(
    'ytmusic-responsive-list-item-renderer',
  );
  const position = button.dataset.position as Position | undefined;
  if (!row || !position || button.disabled) return;

  button.disabled = true;
  moveRow(row, position)
    .catch((error: unknown) => console.error(error))
    .finally(() => {
      button.disabled = false;
    });
};

export default createPlugin({
  name: () => t('plugins.playlist-reorder.name'),
  description: () => t('plugins.playlist-reorder.description'),
  restartNeeded: false,
  config: {
    enabled: true,
  },
  stylesheets: [style],
  renderer: {
    observer: null as MutationObserver | null,
    scheduled: false,

    start() {
      document.addEventListener('click', onClick, true);

      // Rows are added lazily (continuations) and re-rendered on navigation.
      // Mutations outside browse pages (e.g. the player clock) are ignored.
      this.observer = new MutationObserver((mutations) => {
        if (this.scheduled) return;
        const touchesBrowsePage = mutations.some(
          ({ target }) =>
            target instanceof Element &&
            target.closest('ytmusic-browse-response') !== null,
        );
        if (!touchesBrowsePage) return;
        this.scheduled = true;
        requestAnimationFrame(() => {
          this.scheduled = false;
          decorateAllRows();
        });
      });
      this.observer.observe(document.body, { childList: true, subtree: true });
      decorateAllRows();
    },
    stop() {
      document.removeEventListener('click', onClick, true);
      this.observer?.disconnect();
      this.observer = null;
      for (const element of document.querySelectorAll(`.${BUTTONS_CLASS}`)) {
        element.remove();
      }
    },
  },
});
