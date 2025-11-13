import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { Claude } from './sidePanel';

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<Claude />
	</StrictMode>
);
