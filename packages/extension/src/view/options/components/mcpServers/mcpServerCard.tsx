/**
 * External dependencies.
 */
import { EditIcon } from 'lucide-react';
import { Button, ToggleSwitch } from '@google-awlt/design-system';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { MCPServerConfig } from '@google-awlt/common';

interface MCPServerCardProps {
	server: MCPServerConfig;
	tools: Tool[];
	onToggle: (enabled: boolean) => void;
	onEdit: () => void;
}

export function MCPServerCard({
	server,
	onToggle,
	tools,
	onEdit,
}: MCPServerCardProps) {
	return (
		<div className="flex flex-col p-5 bg-[var(--surface-color)] rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
			<div className="flex justify-between items-start mb-3">
				<div>
					<h3 className="text-lg font-bold text-primary">
						{server.name}
					</h3>
				</div>
				<ToggleSwitch
					checked={server.enabled}
					onCheckedChange={onToggle}
					className="data-[state=checked]:bg-green-400"
				/>
			</div>
			<div className="flex justify-between items-center mt-auto pt-3 border-t border-gray-200">
				<div className="flex gap-2 flex-wrap">
					Total Tools: {tools.length}
				</div>

				<Button
					variant="ghost"
					size="sm"
					onClick={onEdit}
					className="text-[var(--primary-color)] hover:text-[var(--primary-hover)] hover:bg-[var(--surface-active)]"
				>
					<EditIcon size={14} />
					Edit
				</Button>
			</div>
		</div>
	);
}
