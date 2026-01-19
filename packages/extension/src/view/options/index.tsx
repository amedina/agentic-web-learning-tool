/**
 * External dependecies
 */
import { SidebarProvider } from '@google-awlt/design-system';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { McpContextProvider } from '@google-awlt/mcp-inspector';

/**
 * Internal dependencies
 */
import './index.css';
import Options from './options';
import { SettingsProvider } from '../stateProviders';
import { ModelProvider, ToolProvider, MCPProvider } from './providers';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <div className="w-screen h-screen">
      <McpContextProvider>
        <ModelProvider>
          <ToolProvider>
            <MCPProvider>
              <SettingsProvider view="options">
                <SidebarProvider>
                  <Options />
                </SidebarProvider>
              </SettingsProvider>
            </MCPProvider>
          </ToolProvider>
        </ModelProvider>
      </McpContextProvider>
    </div>
  </StrictMode>
);
