import type { Preview } from '@storybook/react';
import '../src/index.css';

// Mock chrome global
if (typeof globalThis.chrome === 'undefined') {
  globalThis.chrome = {
    devtools: {
      inspectedWindow: {
        tabId: 123,
      },
    },
    storage: {
      session: {
        get: async () => ({}),
        set: async () => {},
      },
      local: {
        get: async () => ({}),
        set: async () => {},
      },
    },
    runtime: {
      onMessage: {
        addListener: () => {},
        removeListener: () => {},
      },
      sendMessage: async () => {},
    },
  } as any;
}

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
