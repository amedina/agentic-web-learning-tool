import type { StorybookConfig } from '@storybook/react-vite';
import { mergeConfig } from 'vite';
import svgr from 'vite-plugin-svgr';
import path from 'path';

const config: StorybookConfig = {
  stories: [
    '../../design-system/src/components/**/*.stories.@(js|jsx|ts|tsx)',
    '../../../extensions/awl/src/view/**/*.stories.@(js|jsx|ts|tsx)',
  ],
  addons: [
    '@chromatic-com/storybook',
    '@storybook/addon-docs',
    '@storybook/addon-onboarding',
    '@storybook/addon-a11y',
    '@storybook/addon-vitest',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  async viteFinal(config) {
    return mergeConfig(config, {
      plugins: [svgr()],
      resolve: {
        alias: {
          '@agentic-web-labs/design-system': path.resolve(
            __dirname,
            '../../design-system/src'
          ),
          '@agentic-web-labs/awl': path.resolve(
            __dirname,
            '../../../extensions/awl/src'
          ),
          '@agentic-web-labs/table': path.resolve(__dirname, '../../table/src'),
          '@agentic-web-labs/common': path.resolve(
            __dirname,
            '../../common/src'
          ),
        },
      },
    });
  },
};
export default config;
