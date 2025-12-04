import { useState } from 'react';
import reactLogo from '../../assets/react.svg';
import viteLogo from '../../assets/vite.svg';
import { Button } from '@google-awlt/design-system';

function SidePanel() {
	const [count, setCount] = useState(0);

	return (
		<main className="max-w-7xl m-auto min-h-screen flex flex-col items-center justify-center gap-5">
			<div className="flex gap-5">
				<Button variant="link" size="icon">
					<a href="https://vite.dev" target="_blank">
						<img src={viteLogo} className="logo" alt="Vite logo" />
					</a>
				</Button>
				<Button variant="link" size="icon">
					<a href="https://react.dev" target="_blank">
						<img
							src={reactLogo}
							className="logo react"
							alt="React logo"
						/>
					</a>
				</Button>
			</div>
			<h1 className="text-2xl">Vite + React</h1>
			<div className="flex flex-col items-center justify-center">
				<button onClick={() => setCount((count) => count + 1)}>
					count is {count}
				</button>
				<p className="text-2xl">
					Edit <code>src/App.tsx</code> and save to test HMR
				</p>
			</div>
			<p className="read-the-docs">
				Click on the Vite and React logos to learn more
			</p>
		</main>
	);
}

export default SidePanel;
