/**
 * External dependencies.
 */
import { useState, useEffect, useCallback } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, TrashIcon, SaveIcon, FlaskConical } from 'lucide-react';
import type { MCPServerConfig } from '@google-awlt/common';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';

/**
 * Internal dependencies.
 */
import { Button } from '../button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../tabs';
import { ConfigInput } from './configInput';
import { ToolDisplay } from './toolDisplay';

interface MCPServerDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	server: MCPServerConfig;
	toolList: Tool[];
	onSave: (config: MCPServerConfig, serverName: string) => Promise<void>;
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
	toolList = [],
	onSave,
	onDelete,
	validator,
}: MCPServerDialogProps) {
	const [config, setConfig] = useState(initialState);
	const [errors, setErrors] = useState<string[]>([]);
	const [isValidConfig, setIsValidConfig] = useState<boolean>(false);

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

	const handleSave = useCallback(async () => {
		await onSave(config, !server?.name ? crypto.randomUUID() : serverId);
		onOpenChange(false);
	}, [config, server]);

	return (
		<Dialog.Root open={open} onOpenChange={onOpenChange}>
			<Dialog.Portal>
				<Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
				<Dialog.Content
					aria-describedby={undefined}
					className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] w-[90vw] max-h-[90vh] bg-background text-foreground border border-gray-200 rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden"
				>
					<div className="flex items-center justify-between px-6 py-4 bg-background">
						<div className="flex items-center gap-3">
							<Dialog.Title className="text-lg font-bold">
								{serverId
									? 'Edit MCP Server Config'
									: 'New MCP Server'}
							</Dialog.Title>
						</div>
						<Dialog.Close asChild>
							<Button variant="ghost">
								<X size={20} />
							</Button>
						</Dialog.Close>
					</div>

					<div className="flex-grow flex flex-col p-5 overflow-hidden relative">
						<div className="flex-1 flex flex-col p-0 gap-2 relative bg-background overflow-auto">
							<Tabs defaultValue="config">
								<TabsList>
									<TabsTrigger value="config">
										Config
									</TabsTrigger>
									<TabsTrigger
										value="tools"
										className={`${toolList.length === 0 ? 'opacity-50 cursor-default' : ''}`}
										disabled={toolList.length === 0}
									>
										Tools
									</TabsTrigger>
								</TabsList>
								<TabsContent value="config">
									<ConfigInput
										config={config}
										setConfig={setConfig}
									/>
								</TabsContent>
								<TabsContent value="tools">
									<ToolDisplay toolList={toolList} />
								</TabsContent>
							</Tabs>
						</div>

						<div className="p-6 max-md:flex-col max-md:items-start bg-background flex-none flex items-center justify-between gap-4">
							<div className="flex-1">
								{server && onDelete && (
									<Button
										variant="destructive"
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
