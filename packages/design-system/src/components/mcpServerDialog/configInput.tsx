/**
 * External dependencies.
 */
import { type Dispatch, type SetStateAction } from 'react';
import { Link, Lock } from 'lucide-react';
import type { MCPServerConfig } from '@google-awlt/common';

/**
 * Internal dependencies.
 */
import InputGroup from '../inputGroup';
import Input from '../input';
import ToggleSwitch from '../toggleSwitch';

interface MCPServerConfigInput {
	config: MCPServerConfig;
	setConfig: Dispatch<SetStateAction<MCPServerConfig>>;
}

export function ConfigInput({ config, setConfig }: MCPServerConfigInput) {
	return (
		<div className="flex-1 flex flex-col p-0 gap-2 relative bg-background overflow-auto">
			<InputGroup label="Server Nickname">
				<div className="relative">
					<Input
						type="text"
						value={config.name}
						onChange={(e) =>
							setConfig((prev) => ({
								...prev,
								name: e.target.value,
							}))
						}
						className="bg-transparent border-darth-vader text-accent-foreground transition-all w-full pl-3 pr-9 py-2 rounded-md text-sm font-mono"
						placeholder="www.github.com"
					/>
					<Link className="absolute right-3 top-2.5 w-4 h-4 text-exclusive-plum" />
				</div>
			</InputGroup>
			<InputGroup label="MCP Server URL">
				<div className="relative">
					<Input
						type="text"
						value={config.url}
						onChange={(e) =>
							setConfig((prev) => ({
								...prev,
								url: e.target.value,
							}))
						}
						className="bg-transparent border-darth-vader text-accent-foreground transition-all w-full pl-3 pr-9 py-2 rounded-md text-sm font-mono"
						placeholder="www.github.com"
					/>
					<Link className="absolute right-3 top-2.5 w-4 h-4 text-exclusive-plum" />
				</div>
			</InputGroup>
			<InputGroup label="Authorisation Token">
				<div className="relative">
					<Input
						type="text"
						value={config.authToken}
						onChange={(e) =>
							setConfig((prev) => ({
								...prev,
								authToken: e.target.value,
							}))
						}
						className="bg-transparent border-darth-vader text-accent-foreground transition-all w-full pl-3 pr-9 py-2 rounded-md text-sm font-mono"
						placeholder="sk-..."
					/>
					<Lock className="absolute right-3 top-2.5 w-4 h-4 text-exclusive-plum" />
				</div>
			</InputGroup>
			<InputGroup label="Status">
				<div className="relative">
					<ToggleSwitch
						checked={config.enabled}
						className="data-[state=checked]:bg-green-400"
						onCheckedChange={(value) =>
							setConfig((prev) => {
								const newValue = prev;
								newValue['enabled'] = value;
								return newValue;
							})
						}
					/>
				</div>
			</InputGroup>
		</div>
	);
}
