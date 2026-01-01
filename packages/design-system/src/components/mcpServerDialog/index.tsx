/**
 * External dependencies.
 */
import { useState, useEffect, useCallback } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, TrashIcon, SaveIcon, FlaskConical, Link, Lock } from 'lucide-react';
import type { MCPServerConfig } from '@google-awlt/common';

/**
 * Internal dependencies.
 */
import { Button } from '../button';
import InputGroup from '../inputGroup';
import Input from '../input';
import { ToggleSwitch } from '..';

interface MCPServerDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	server: MCPServerConfig;
	onSave: (config: MCPServerConfig, serverName: string) => void;
	onDelete?: (serverName: string) => void;
	validator: (
		config: MCPServerConfig,
		serverName: string
	) => { isValid: boolean; errors: string[] };
	serverId: string;
}

const initialState: MCPServerConfig = {
	transport: 'http',
	url: '',
	authToken: '',
	enabled: true,
	name: '',
};

export function MCPServerDialog({
	open,
	onOpenChange,
	server,
	serverId,
	onSave,
	onDelete,
	validator,
}: MCPServerDialogProps) {
	const [config, setConfig] = useState(initialState);
	const [errors, setErrors] = useState<string[]>([]);
	const [isValidConfig, setIsValidConfig] = useState<boolean>(false);
	console.log(isValidConfig, JSON.stringify(config), JSON.stringify(server));
	useEffect(() => {
		if (open) {
			if (serverId) {
				setConfig(server);
			}
		}
	}, [open, server]);

	const handleValidate = useCallback(() => {
		const { errors, isValid } = validator(config, config.name);
		setErrors(errors);
		setIsValidConfig(isValid);
	}, [config]);

	const handleSave = useCallback(() => {
		onSave(config, !server?.name ? crypto.randomUUID() : serverId);
		onOpenChange(false);
	}, [config, server]);

	return (
		<Dialog.Root open={open} onOpenChange={onOpenChange}>
			<Dialog.Portal>
				<Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
				<Dialog.Content
					aria-describedby={undefined}
					className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] w-max h-max bg-white text-gray-900 border border-gray-200 rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden"
				>
					{/* Header */}
					<div className="flex items-center justify-between px-6 py-4 bg-white">
						<div className="flex items-center gap-3">
							<Dialog.Title className="text-lg font-bold">
								{serverId
									? 'Edit MCP Server Config'
									: 'New MCP Server'}
							</Dialog.Title>
						</div>
						<Dialog.Close asChild>
							<button className="text-gray-500 hover:text-gray-900 transition-colors">
								<X size={20} />
							</button>
						</Dialog.Close>
					</div>

					<div className="flex-grow flex flex-col p-5 overflow-hidden relative">
						<div className="flex-1 flex flex-col p-0 gap-2 relative bg-white overflow-auto">
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

						<div className="p-6 border-t border-gray-200 bg-white flex-none flex items-center justify-between gap-4">
							<div className="flex-1">
								{server && onDelete && (
									<Button
										variant="ghost"
										className="text-red-500 hover:text-red-700 hover:bg-red-50 gap-2"
										onClick={() => onDelete(serverId)}
									>
										<TrashIcon size={16} /> Delete
									</Button>
								)}
							</div>
							<div className="flex gap-3">
								<Dialog.Close asChild>
									<Button variant="outline">Cancel</Button>
								</Dialog.Close>
								<Button
									className={`${!isValidConfig ? 'bg-amber-600 hover:bg-amber-500' : 'bg-green-600 hover:bg-green-700'} gap-2`}
									onClick={handleValidate}
									disabled={isValidConfig}
								>
									<FlaskConical size={16} /> Validate
								</Button>
								<Button
									className={`${isValidConfig ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-700'} ${JSON.stringify(config) === JSON.stringify(server) ? 'opacity-50 cursor-not-allowed' : ''} gap-2`}
									onClick={handleSave}
									disabled={
										!isValidConfig &&
										JSON.stringify(config) ===
											JSON.stringify(server)
									}
								>
									<SaveIcon size={16} /> Add Server
								</Button>
							</div>
						</div>
					</div>
				</Dialog.Content>
			</Dialog.Portal>
		</Dialog.Root>
	);
}
