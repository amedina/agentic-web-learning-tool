/**
 * External dependencies
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { TablePersistentSettingsProvider } from '@google-awlt/design-system';
/**
 * Internal dependencies
 */
import './index.css';
import DevTools, { client, transport } from './devtools';
import { SettingsProvider } from '../stateProviders';
import { McpClientProvider } from '@mcp-b/react-webmcp';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <McpClientProvider client={client} transport={transport}>
      <TablePersistentSettingsProvider>
        <SettingsProvider view="devtools">
          <DevTools />
        </SettingsProvider>
      </TablePersistentSettingsProvider>
    </McpClientProvider>
  </StrictMode>
);
