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
import DevTools from './devtools';
import { SettingsProvider } from '../stateProviders';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TablePersistentSettingsProvider>
      <SettingsProvider view="devtools">
        <DevTools />
      </SettingsProvider>
    </TablePersistentSettingsProvider>
  </StrictMode>
);
