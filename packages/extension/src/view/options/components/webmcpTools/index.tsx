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
  mcpbTools,
} from '../../../../contentScript/tools/mcpbTools';

export function WebMCPToolsTab() {
  const {
    userTools,
    builtInTools,
    saveUserTools,
    saveBuiltInState,
    chromeAPIBuiltInToolsState,
    saveExtensionToolsState,
  } = useToolProvider(({ state, actions }) => ({
    userTools: state.userTools,
    builtInTools: state.builtInTools,
    saveUserTools: actions.saveUserTools,
    saveBuiltInState: actions.saveBuiltInState,
    chromeAPIBuiltInToolsState: state.chromeAPIBuiltInToolsState,
    saveExtensionToolsState: actions.saveExtensionToolsState,
  }));

  const { isDarkMode } = useSettings(({ state }) => ({
    isDarkMode: state.isDarkMode,
  }));

  const mcpbBuiltInTools = useMemo(() => {
    return Object.keys(mcpbTools).map((toolkey) => {
      return {
        ...mcpbTools[toolkey as keys],
        enabled: chromeAPIBuiltInToolsState[toolkey]?.enabled,
      };
    });
  }, [chromeAPIBuiltInToolsState]);

  return (
    <WebMCPToolsUI
      userTools={userTools}
      builtInTools={builtInTools}
      mcpbTools={mcpbBuiltInTools}
      onSaveUserTools={saveUserTools}
      onSaveBuiltInState={saveBuiltInState}
      saveExtensionToolsState={saveExtensionToolsState}
      isDarkMode={isDarkMode}
    />
  );
}
