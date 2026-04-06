/**
 * Internal dependencies
 */
import { INITIAL_PROVIDERS } from '../../../constants';
import type { APIKeys } from '../../../../types';

const createModelDropdown = (apiKeys: { [key: string]: APIKeys }) => {
  const availableModelProviders = Object.keys(apiKeys).filter(
    (key) => apiKeys[key].status
  );
  //Add browser-ai by default since it doesnt require apiKeys
  availableModelProviders.push('browser-ai');

  const modelProviders = availableModelProviders.map((provider) => {
    const {
      id = '',
      name = '',
      models = [],
    } = INITIAL_PROVIDERS.find(
      ({ id }) => provider === id
    ) as (typeof INITIAL_PROVIDERS)[1];

    return {
      id,
      label: name,
      hideLabel: true,
      group: id,
      items: [
        {
          id,
          label: name,
          mainLabel: 'Models',
          submenu: apiKeys[provider]?.thinkingMode
            ? models.filter((model) => model?.thinking)
            : models,
        },
      ],
    };
  });

  return modelProviders.filter(
    ({ items }) => items[0]?.submenu && items[0]?.submenu.length >= 1
  );
};

export default createModelDropdown;
