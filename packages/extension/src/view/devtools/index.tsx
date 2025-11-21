import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import Inspector from './inspector';

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<Inspector />
	</StrictMode>
);
