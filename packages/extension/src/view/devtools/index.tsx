import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import Devtools from './devtools';

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<Devtools />
	</StrictMode>
);
