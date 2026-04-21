/**
 * External dependecies
 */
import { SidebarProvider } from '@google-awlt/design-system';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// Internal dependencies

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
      <ModelProvider>
        <ToolProvider>
          <MCPProvider>
            <SettingsProvider view="options">
              <SidebarProvider defaultSelectedMenuItem="models">
                <Options />
              </SidebarProvider>
            </SettingsProvider>
          </MCPProvider>
        </ToolProvider>
      </ModelProvider>
    </div>
  </StrictMode>
);
