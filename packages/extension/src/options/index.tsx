import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import './index.css';
import OptionsPanel from './optionsPanel';

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<OptionsPanel />
	</StrictMode>
);
