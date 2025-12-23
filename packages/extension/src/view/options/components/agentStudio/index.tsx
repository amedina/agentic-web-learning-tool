/**
 * External dependencies
 */
import { useState, useCallback, useMemo, useEffect } from 'react';
import { Plus, Search, Settings2, Cpu } from 'lucide-react';
import { Button, Input } from '@google-awlt/design-system';
/**
 * Internal dependencies
 */
import type { AgentType } from '../../../../types';
import ConfigModal from './configModal';
import { DEFAULT_FORM_STATE } from './constants';

export default function AgentDashboard() {
	const [agents, setAgents] = useState<AgentType[]>([]);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editingAgent, setEditingAgent] = useState<AgentType | null>(null);
	const [searchQuery, setSearchQuery] = useState('');

	const handleEdit = useCallback((agent: AgentType) => {
		setEditingAgent(agent);
		setIsModalOpen(true);
	}, []);

	const handleCreate = useCallback(() => {
		setEditingAgent(DEFAULT_FORM_STATE);
		setIsModalOpen(true);
	}, []);

	const handleSaveAgent = useCallback(async (data: AgentType) => {
		const { agents }: { agents: AgentType[] } =
			await chrome.storage.sync.get('agents');

		const isOldAgent = !data.id;
		if (isOldAgent) {
			const updatedAgents = agents.map((agent) =>
				agent.id === data.id ? { ...agent, ...data } : { ...agent }
			);
			await chrome.storage.sync.set({ agents: updatedAgents });
		} else {
			agents.push({
				...data,
				id: crypto.randomUUID(),
			});
			await chrome.storage.sync.set({ agents });
		}
		setIsModalOpen(false);
	}, []);

	const handleDeleteAgent = useCallback(async (id: string) => {
		setAgents((prev) => prev.filter((a) => a.id !== id));
		const { agents }: { agents: AgentType[] } =
			await chrome.storage.sync.get('agents');
		const updatedAgents = agents.filter((agent) => agent.id !== id);
		await chrome.storage.sync.set({ agents: updatedAgents });
		setIsModalOpen(false);
	}, []);

	useEffect(() => {
		(async () => {
			const { agents }: { agents: AgentType[] } =
				await chrome.storage.sync.get('agents');
			setAgents(agents);
		})();
	});

	const filteredAgents = useMemo(
		() =>
			agents.filter(
				(a) =>
					a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
					a.model.toLowerCase().includes(searchQuery.toLowerCase())
			),
		[agents, searchQuery]
	);

	return (
		<div className="min-h-screen w-full bg-background p-6 md:p-12">
			{/* Modal */}
			<ConfigModal
				isOpen={isModalOpen}
				onClose={() => setIsModalOpen(false)}
				initialData={editingAgent}
				onSave={handleSaveAgent}
				onDelete={handleDeleteAgent}
			/>

			<div className="max-w-6xl mx-auto space-y-8">
				{/* Header Section */}
				<div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
					<div>
						<div className="flex items-center gap-3 mb-1">
							<div className="w-8 h-8 bg-accent-foreground text-aswad rounded-lg flex items-center justify-center">
								<Cpu className="w-5 h-5" />
							</div>
							<h1 className="text-xl font-bold text-accent-foreground tracking-tight">
								Agent Studio
							</h1>
						</div>
						<p className="text-sm text-accent-foreground max-w-md leading-relaxed">
							Manage your LLM agents, configure connection
							settings, and fine-tune inference parameters.
						</p>
					</div>

					<div className="flex items-center gap-3 w-full md:w-auto">
						<div className="relative flex-1 md:w-64">
							<Search className="absolute left-3 top-2.5 w-4 h-4 text-exclusive-plum" />
							<Input
								type="text"
								placeholder="Search agents..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="bg-transparent border-darth-vader text-accentfore-ground transition-all w-full pl-9 pr-4 py-2 rounded-lg text-sm bg-existental-angst"
							/>
						</div>
						<Button
							onClick={handleCreate}
							className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm hover:opacity-90 transition-opacity whitespace-nowrap"
						>
							<Plus className="w-4 h-4" />
							New Agent
						</Button>
					</div>
				</div>

				{/* Dashboard Grid */}
				{filteredAgents.length > 0 ? (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
						{filteredAgents.map((agent) => (
							<div
								key={agent.id}
								onClick={() => handleEdit(agent)}
								className="group bg-existental-angst border border-darth-vader rounded-xl p-5 cursor-pointer hover:bg-aswad hover:border-volcanic-sand transition-all duration-200 shadow-sm relative overflow-hidden"
							>
								{/* Top Row */}
								<div className="flex justify-between items-start mb-4">
									<div className="flex items-center gap-3">
										<div className="w-10 h-10 rounded-lg bg-aswad border border-darth-vader flex items-center justify-center text-[10px] font-bold text-amethyst-haze uppercase tracking-wider">
											{agent.modelProvider.slice(0, 2)}
										</div>
										<div>
											<h3 className="text-sm font-semibold text-accent-foreground group-hover:text-baby-blue transition-colors">
												{agent.name}
											</h3>
											<div className="text-[11px] font-mono text-amethyst-haze mt-0.5">
												{agent.model}
											</div>
										</div>
									</div>
								</div>

								{/* Details Row */}
								<div className="flex items-center gap-4 py-3 border-t border-darth-vader border-dashed">
									<div className="flex flex-col">
										<span className="text-[10px] text-exclusive-plum uppercase font-semibold">
											Temp
										</span>
										<span className="text-xs font-mono text-accent-foreground">
											{agent.temperature}
										</span>
									</div>
									<div className="w-px h-6 bg-darth-vader"></div>
								</div>

								{/* Hover Action */}
								<div className="absolute top-4 right-4">
									<div
										className={`w-2 h-2 group-hover:hidden rounded-full ${agent.status ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-700'}`}
									/>
									<Settings2 className="w-4 h-4 hidden group-hover:block text-exclusive-plum" />
								</div>
							</div>
						))}
					</div>
				) : (
					<div className="flex flex-col items-center justify-center py-20 text-center bg-existental-angst border-darth-vader rounded-xl border-dashed">
						<div className="w-12 h-12 bg-aswad rounded-full flex items-center justify-center mb-4">
							<Search className="w-6 h-6 text-exclusive-plum" />
						</div>
						<h3 className="text-sm font-medium text-accent-foreground">
							No agents found
						</h3>
						<p className="text-xs text-amethyst-haze mt-1 mb-4">
							Try a different search term or create a new agent.
						</p>
						<Button
							onClick={handleCreate}
							className="text-xs font-medium text-accent-foreground underline underline-offset-4 hover:text-baby-blue"
						>
							Create New Agent
						</Button>
					</div>
				)}
			</div>
		</div>
	);
}

