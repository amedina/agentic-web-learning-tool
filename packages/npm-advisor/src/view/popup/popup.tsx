/**
 * External dependencies.
 */
import React from 'react';
import { createRoot } from 'react-dom/client';

const container = document.getElementById('root');
const root = createRoot(container!);

root.render(
  <React.StrictMode>
    <div style={{ padding: '20px', minWidth: '200px', textAlign: 'center' }}>
      <h1>Hello World</h1>
      <p>Welcome to NPM Advisor</p>
    </div>
  </React.StrictMode>
);
