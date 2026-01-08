/**
 * External dependencies
 */
import { WebMCPToolsTab as WebMCPToolsUI } from '@google-awlt/design-system';
import { useMemo } from 'react';
/**
 * Internal Dependencies.
 */
import { useToolProvider } from '../../providers';
import { useSettings } from '../../../stateProviders';
import {
  type keys,
  builtInTools as builtInExtensionTools,
} from '../../../../contentScript/tools/builtInTools';

export function WebMCPToolsTab() {
  const {
    userTools,
    builtInTools,
    saveUserTools,
    saveBuiltInState,
    extensionToolsState,
    saveExtensionToolsState,
  } = useToolProvider(({ state, actions }) => ({
    userTools: state.userTools,
    builtInTools: state.builtInTools,
    saveUserTools: actions.saveUserTools,
    saveBuiltInState: actions.saveBuiltInState,
    extensionToolsState: state.extensionTools,
    saveExtensionToolsState: actions.saveExtensionToolsState,
  }));

  const { isDarkMode } = useSettings(({ state }) => ({
    isDarkMode: state.isDarkMode,
  }));

  const extensionTools = useMemo(() => {
    return Object.keys(builtInExtensionTools).map((toolkey) => {
      console.log(extensionToolsState[toolkey].enabled);
      return {
        ...builtInExtensionTools[toolkey as keys],
        enabled: extensionToolsState[toolkey].enabled,
      };
    });
  }, [extensionToolsState, builtInTools]);

  return (
    <WebMCPToolsUI
      userTools={userTools}
      builtInTools={[...builtInTools, ...extensionTools]}
      onSaveUserTools={saveUserTools}
      onSaveBuiltInState={saveBuiltInState}
      saveExtensionToolsState={saveExtensionToolsState}
      isDarkMode={isDarkMode}
    />
  );
}
