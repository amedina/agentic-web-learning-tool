import type { StorybookConfig } from '@storybook/react-vite';
import { mergeConfig } from 'vite';
import svgr from 'vite-plugin-svgr';
import path from 'path';

const config: StorybookConfig = {
  stories: [
    '../../design-system/src/components/**/*.stories.@(js|jsx|ts|tsx)',
    '../../extension/src/view/**/*.stories.@(js|jsx|ts|tsx)',
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
          '@google-awlt/design-system': path.resolve(
            __dirname,
            '../../design-system/src'
          ),
          '@google-awlt/awl': path.resolve(
            __dirname,
            '../../extensions/awl/src'
          ),
          '@google-awlt/table': path.resolve(__dirname, '../../table/src'),
          '@google-awlt/common': path.resolve(__dirname, '../../common/src'),
        },
      },
    });
  },
};
export default config;
