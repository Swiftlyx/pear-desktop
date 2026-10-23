import { IconChevronLeft } from '@mdui/icons/chevron-left.js';
import { IconChevronRight } from '@mdui/icons/chevron-right.js';
import { render } from 'solid-js/web';

import { t } from '@/i18n';
import { LitElementWrapper } from '@/solit';
import { createPlugin } from '@/utils';

type NavigationConfig = {
  enabled: boolean;
};

export default createPlugin<
  unknown,
  unknown,
  {
    buttonContainer: HTMLDivElement;
    navBarObserver: MutationObserver | null;
    waitTimer: ReturnType<typeof setTimeout> | undefined;
    attach: () => void;
  },
  NavigationConfig
>({
  name: () => t('plugins.navigation.name'),
  description: () => t('plugins.navigation.description'),
  restartNeeded: false,
  config: {
    enabled: true,
  },
  renderer: {
    buttonContainer: document.createElement('div'),
    navBarObserver: null,
    waitTimer: undefined,
    start() {
      if (!this.buttonContainer) {
        this.buttonContainer = document.createElement('div');
      }

      render(
        () => (
          <>
            <mdui-tooltip
              content={t('plugins.navigation.templates.back.title')}
            >
              <mdui-button-icon
                onClick={() => history.back()}
                style={{ width: '40px', height: '40px' }}
              >
                <LitElementWrapper
                  elementClass={IconChevronLeft}
                  props={{
                    style: {
                      'padding': '5px',
                      'scale': '1.5',
                      'font-size': '24px',
                    },
                  }}
                />
              </mdui-button-icon>
            </mdui-tooltip>
            <mdui-tooltip
              content={t('plugins.navigation.templates.forward.title')}
            >
              <mdui-button-icon
                onClick={() => history.forward()}
                style={{ width: '40px', height: '40px' }}
              >
                <LitElementWrapper
                  elementClass={IconChevronRight}
                  props={{
                    style: {
                      'padding': '5px',
                      'scale': '1.5',
                      'font-size': '24px',
                    },
                  }}
                />
              </mdui-button-icon>
            </mdui-tooltip>
          </>
        ),
        this.buttonContainer,
      );
      this.attach();
    },
    // The nav bar can render after start and re-render later, which dropped
    // the buttons for the rest of the session: they go back whenever missing
    attach() {
      const navBar = document.querySelector('ytmusic-nav-bar');
      if (!navBar) {
        this.waitTimer = setTimeout(() => this.attach(), 500);
        return;
      }
      const place = () => {
        const menu = navBar.querySelector('#right-content');
        if (menu && this.buttonContainer.parentElement !== menu) {
          menu.prepend(this.buttonContainer);
        }
      };
      place();
      this.navBarObserver = new MutationObserver(place);
      this.navBarObserver.observe(navBar, { childList: true, subtree: true });
    },
    stop() {
      clearTimeout(this.waitTimer);
      this.navBarObserver?.disconnect();
      this.navBarObserver = null;
      this.buttonContainer.remove();
      this.buttonContainer.replaceChildren();
    },
  },
});
