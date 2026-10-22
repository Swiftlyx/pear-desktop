import { t } from '@/i18n';
import { createPlugin } from '@/utils';

import type { MusicPlayer } from '@/types/music-player';
import type { VideoDataChanged } from '@/types/video-data-changed';

export type AudioOnlyConfig = {
  enabled: boolean;
};

export default createPlugin<
  unknown,
  unknown,
  {
    api: MusicPlayer | null;
    playbackModeObserver: MutationObserver | null;
    toggleObserver: MutationObserver | null;
    videoDataListener: ((e: Event) => void) | null;
    setAudioOnly: () => void;
    applyVisualMode: () => void;
    lockPlaybackMode: (player: HTMLElement) => void;
    preferSong: () => void;
    watchToggle: () => void;
    showCover: () => void;
  },
  AudioOnlyConfig
>({
  name: () => t('plugins.audio-only.name'),
  description: () => t('plugins.audio-only.description'),
  restartNeeded: true,
  config: {
    enabled: false,
  },
  renderer: {
    api: null,
    playbackModeObserver: null,
    toggleObserver: null,
    videoDataListener: null,

    start() {
      // Hide video element, show album art
      this.applyVisualMode();

      // Lock playback-mode so the page can never flip it back
      const player = document.querySelector<HTMLElement>('ytmusic-player');
      if (player) {
        player.setAttribute('playback-mode', 'ATV_PREFERRED');
        player.style.margin = 'auto 0px';
        this.lockPlaybackMode(player);
      }

      this.watchToggle();
    },

    onPlayerApiReady(api) {
      this.api = api;

      // The API can re-initialize, so drop the old listener instead of stacking.
      if (this.videoDataListener) {
        document.removeEventListener('videodatachange', this.videoDataListener);
      }

      this.setAudioOnly();

      this.videoDataListener = ((event: CustomEvent<VideoDataChanged>) => {
        if (event.detail.name === 'dataloaded') {
          this.setAudioOnly();
          this.applyVisualMode();
          this.preferSong();
          this.showCover();
        }
      }) as EventListener;

      document.addEventListener('videodatachange', this.videoDataListener);
      console.log('[audio-only] Renderer audio-only mode active');
    },

    stop() {
      if (this.playbackModeObserver) {
        this.playbackModeObserver.disconnect();
        this.playbackModeObserver = null;
      }
      if (this.toggleObserver) {
        this.toggleObserver.disconnect();
        this.toggleObserver = null;
      }
      if (this.videoDataListener) {
        document.removeEventListener('videodatachange', this.videoDataListener);
        this.videoDataListener = null;
      }
    },

    // --- Internal methods ---

    setAudioOnly() {
      const player = document.querySelector<HTMLElement>('ytmusic-player');
      if (player) {
        player.setAttribute('playback-mode', 'ATV_PREFERRED');
        player.style.margin = 'auto 0px';
      }

      // Lowest quality triggers the audio-only path.
      try {
        const moviePlayer = document.querySelector<
          HTMLVideoElement & {
            setPlaybackQualityRange?: (quality: string) => void;
            setPlaybackQuality?: (quality: string) => void;
          }
        >('#movie_player');
        if (moviePlayer) {
          if (moviePlayer.setPlaybackQualityRange) {
            moviePlayer.setPlaybackQualityRange('tiny');
          }
          if (moviePlayer.setPlaybackQuality) {
            moviePlayer.setPlaybackQuality('tiny');
          }
        }
      } catch {
        /* ignore */
      }

      this.applyVisualMode();
    },

    applyVisualMode() {
      const songVideo = document.querySelector<HTMLElement>(
        '#song-video.ytmusic-player',
      );
      const songImage = document.querySelector<HTMLElement>('#song-image');
      if (songVideo) songVideo.style.display = 'none';
      if (songImage) songImage.style.display = 'block';

      const video = document.querySelector<HTMLVideoElement>('video');
      if (video) {
        video.style.display = 'none';
      }
    },

    lockPlaybackMode(player: HTMLElement) {
      // Prevent the page from overriding playback-mode back to OMV_PREFERRED
      this.playbackModeObserver = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          if (mutation.target instanceof HTMLElement) {
            const current = mutation.target.getAttribute('playback-mode');
            if (current !== 'ATV_PREFERRED') {
              mutation.target.setAttribute('playback-mode', 'ATV_PREFERRED');
            }
          }
        }
      });
      this.playbackModeObserver.observe(player, {
        attributeFilter: ['playback-mode'],
      });
    },

    // A music video that has a song version switches to the song through the
    // site's own Song/Video toggle, which swaps the track in place. Opening a
    // video link puts the site in video mode, so this runs on every change.
    preferSong() {
      const toggle = document.querySelector<HTMLElement>('ytmusic-av-toggle');
      if (
        toggle?.hasAttribute('selected-queue-item-has-counterpart') &&
        !toggle.hasAttribute('toggle-disabled') &&
        toggle.getAttribute('is-video-playback-mode-selected') === 'true'
      ) {
        toggle.querySelector<HTMLElement>('.song-button')?.click();
      }
    },

    watchToggle() {
      const toggle = document.querySelector<HTMLElement>('ytmusic-av-toggle');
      if (!toggle) return;
      this.toggleObserver = new MutationObserver(() => this.preferSong());
      this.toggleObserver.observe(toggle, {
        attributeFilter: [
          'selected-queue-item-has-counterpart',
          'toggle-disabled',
          'is-video-playback-mode-selected',
        ],
      });
      this.preferSong();
    },

    // Without a song version the video plays hidden and the cover is an
    // empty placeholder over a grey box: the video's own thumbnail fills the
    // box behind it. Song covers load over it as usual.
    showCover() {
      const box = document.querySelector<HTMLElement>(
        '#song-image yt-img-shadow',
      );
      const url = this.api
        ?.getPlayerResponse()
        ?.videoDetails?.thumbnail?.thumbnails?.at(-1)?.url;
      if (!box || !url) return;
      box.style.backgroundImage = `url("${url}")`;
      box.style.backgroundSize = 'cover';
      box.style.backgroundPosition = 'center';
    },
  },
});
