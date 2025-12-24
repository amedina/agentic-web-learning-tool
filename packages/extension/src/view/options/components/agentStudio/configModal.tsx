/**
 * External dependencies
 */
import { useState, useEffect, useCallback } from 'react';
import {
	Zap,
	ShieldCheck,
	Sliders,
	Code2,
	Terminal,
	X,
	Save,
	Trash2,
	Settings2,
} from 'lucide-react';
import {
	Button,
	Dropdown,
	Input,
	InputGroup,
	ToggleSwitch,
} from '@google-awlt/design-system';
import { isEqual } from 'lodash-es';
/**
 * Internal dependencies
 */
import { DEFAULT_FORM_STATE } from './constants';
import type { AgentType } from '../../../../types';
import { INITIAL_PROVIDERS } from '../../../../constants';

type ConfigModalProps = {
	isOpen: boolean;
	onClose: () => void;
	initialData: AgentType | null;
	onSave: (data: AgentType) => void;
	onDelete: (id: string) => void;
};

const REASONING_OPTIONS = [
	{ id: 'minimal', label: 'Minimal: Quick Analysis' },
	{ id: 'low', label: 'Low: Basic Reasoning' },
	{ id: 'medium', label: 'Medium: Balanced Thinking' },
	{ id: 'high', label: 'High: Deep Thinking' },
];
const REASONING_SUMMARY_OPTIONS = [
	{ id: 'auto', label: 'Auto: Model Decides' },
	{ id: 'full', label: 'Detailed: Full Thinking Trace' },
];

const ConfigModal = ({
	isOpen,
	onClose,
	initialData,
	onSave,
	onDelete,
}: ConfigModalProps) => {
	const [formData, setFormData] = useState<AgentType>(DEFAULT_FORM_STATE);

	// Reset form when modal opens with new data
	useEffect(() => {
		if (isOpen) {
			setFormData((prev) => {
				const value = initialData || DEFAULT_FORM_STATE;
				if (isEqual(prev, value)) {
					return prev;
				}
				return value;
			});
		}
	}, [isOpen, initialData]);

	const handleChange = useCallback(
		(field: string, value: string | boolean | number) => {
			setFormData((prev) => ({ ...prev, [field]: value }));
		},
		[]
	);

	if (!isOpen || !initialData) {
		return null;
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center dialog-overlay p-4 sm:p-6">
			<div className="w-full max-w-2xl bg-existental-angst border border-volcanic-sand rounded-xl shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
				<div className="flex items-center justify-between px-6 py-4 border-b border-darth-vader bg-aswad/30 rounded-t-xl">
					<div>
						<h2 className="text-sm font-semibold text-accent-foreground">
							{formData.id
								? 'Edit Agent Configuration'
								: 'Create New Agent'}
						</h2>
						<p className="text-xs text-amethyst-haze mt-0.5">
							Configure parameters, authentication, and identity.
						</p>
					</div>
					<Button
						onClick={onClose}
						className="p-1.5 rounded-md transition-colors"
					>
						<X className="w-4 h-4" />
					</Button>
				</div>

				{/* Scrollable Form Content */}
				<div className="flex-1 overflow-y-auto p-6 space-y-8">
					{/* Identity */}
					<section className="space-y-4">
						<div className="flex items-center gap-2 text-xs font-semibold text-amethyst-haze uppercase tracking-wider">
							<Terminal className="w-3.5 h-3.5" /> Identity
						</div>
						<div className="flex flex-col gap-y-2">
							<div className="w-full">
								<InputGroup label="Name">
									<Input
										required
										type="text"
										value={formData.name}
										onChange={(e) =>
											handleChange('name', e.target.value)
										}
										className="bg-transparent border-darth-vader text-accent-foreground transition-all w-full px-3 py-2 rounded-md text-sm"
										placeholder="e.g. Legal Assistant"
									/>
								</InputGroup>
							</div>
							<div className="w-full flex flex-row gap-2">
								<InputGroup
									label="Model Provider"
									className="w-1/2"
								>
									<div className="relative">
										<Dropdown
											options={INITIAL_PROVIDERS.map(
												(provider) => ({
													id: provider.id,
													label: provider.name,
												})
											)}
											onSelect={(value) =>
												handleChange(
													'modelProvider',
													value
												)
											}
											selectedValue={
												formData.modelProvider
											}
										/>
									</div>
								</InputGroup>

								<InputGroup label="Model" className="w-1/2">
									<div className="relative">
										<Dropdown
											options={
												INITIAL_PROVIDERS.find(
													(provider) =>
														provider.id ===
														formData.modelProvider
												)?.models ?? []
											}
											onSelect={(value) =>
												handleChange('model', value)
											}
											selectedValue={formData.model}
										/>
									</div>
								</InputGroup>
							</div>
						</div>
					</section>

					{/* Connection */}
					<section className="space-y-4">
						<div className="flex items-center gap-2 text-xs font-semibold text-amethyst-haze uppercase tracking-wider">
							<Zap className="w-3.5 h-3.5" /> Connection
						</div>
						<div className="space-y-4">
							<InputGroup label="API Key">
								<div className="relative">
									<Input
										type="password"
										required
										value={formData.apiKey}
										onChange={(e) =>
											handleChange(
												'apiKey',
												e.target.value
											)
										}
										className="bg-transparent border-darth-vader text-accent-foreground transition-all w-full pl-3 pr-9 py-2 rounded-md text-sm font-mono"
										placeholder="sk-..."
									/>
									<ShieldCheck className="absolute right-3 top-2.5 w-4 h-4 text-exclusive-plum" />
								</div>
							</InputGroup>

							<InputGroup label="Provider Endpoint (Optional)">
								<Input
									type="text"
									value={formData.providerUrl}
									onChange={(e) =>
										handleChange(
											'providerUrl',
											e.target.value
										)
									}
									className="bg-transparent border-darth-vader text-accent-foreground transition-all w-full px-3 py-2 rounded-md text-sm font-mono"
									placeholder="https://api.openai.com/v1"
								/>
							</InputGroup>
						</div>
					</section>

					{/* Parameters */}
					<section className="space-y-4">
						<div className="flex items-center gap-2 text-xs font-semibold text-amethyst-haze uppercase tracking-wider">
							<Sliders className="w-3.5 h-3.5" /> Parameters
						</div>

						<div className="p-4 rounded-lg border border-darth-vader bg-aswad/30 space-y-6">
							<div>
								<div className="flex justify-between mb-3">
									<label className="text-[13px] font-medium text-accent-foreground">
										Temperature
									</label>
									<span className="text-xs font-mono bg-existental-angst px-1.5 py-0.5 rounded border border-darth-vader">
										{formData.temperature}
									</span>
								</div>
								<Input
									type="range"
									min="0"
									max="2"
									step="0.1"
									value={formData.temperature}
									onChange={(e) =>
										handleChange(
											'temperature',
											parseFloat(e.target.value)
										)
									}
									className="w-full h-1.5 bg-volcanic-sand rounded-lg appearance-none cursor-pointer accent-accent-foreground"
								/>
							</div>

							<div className="flex items-center justify-between">
								<div>
									<div className="text-[13px] font-medium text-accent-foreground">
										Thinking Mode
									</div>
									<div className="text-[11px] text-amethyst-haze">
										Internal thought process before output.
									</div>
								</div>
								<ToggleSwitch
									checked={formData.thinkingMode}
									onCheckedChange={(v) =>
										handleChange('thinkingMode', v)
									}
								/>
							</div>
							{formData.thinkingMode && (
								<div className="flex flex-row items-center gap-3">
									<div className="flex flex-col items-center justify-start">
										<div className="text-base font-medium text-accent-foreground w-full">
											Reasoning Effort
										</div>
										<Dropdown
											options={REASONING_OPTIONS}
											onSelect={(v) =>
												handleChange(
													'reasoinigEffort',
													v
												)
											}
											selectedValue={
												formData.reasoningEffort ?? ''
											}
										/>
									</div>
									<div className="flex flex-col items-center justify-start">
										<div className="text-base font-medium text-accent-foreground w-full">
											Reasoning summary
										</div>
										<Dropdown
											options={REASONING_SUMMARY_OPTIONS}
											onSelect={(v) =>
												handleChange(
													'reasoningSummary',
													v
												)
											}
											selectedValue={
												formData.reasoningSummary ?? ''
											}
										/>
									</div>
								</div>
							)}
						</div>
					</section>

					{/* Advanced JSON */}
					<section className="space-y-4">
						<div className="flex items-center gap-2 text-xs font-semibold text-amethyst-haze uppercase tracking-wider">
							<Code2 className="w-3.5 h-3.5" /> Advanced Config
						</div>
						<textarea
							value={formData.extraConfig}
							onChange={(e) =>
								handleChange('extraConfig', e.target.value)
							}
							className="bg-transparent border border-darth-vader text-accent-foreground transition-all w-full h-32 px-3 py-2 rounded-md text-xs font-mono"
							spellCheck="false"
						/>
					</section>

					<section className="space-y-4">
						<div className="flex items-center gap-2 text-xs font-semibold text-amethyst-haze uppercase tracking-wider">
							<Settings2 className="w-3.5 h-3.5" /> Agent Settings
						</div>
						<div className="flex items-center justify-between">
							<div>
								<div className="text-[13px] font-medium text-accent-foreground">
									Agent Status
								</div>
								<div className="text-[11px] text-amethyst-haze">
									Availability of the agent for use.
								</div>
							</div>
							<ToggleSwitch
								checked={formData.status}
								onCheckedChange={(value) =>
									handleChange('status', value)
								}
							/>
						</div>
					</section>
				</div>

				{/* Footer */}
				<div className="px-6 py-4 border-t border-darth-vader bg-aswad/30 flex justify-between items-center rounded-b-xl">
					{formData.id ? (
						<Button
							variant="destructive"
							onClick={() => onDelete(formData.id)}
							className="text-xs font-medium flex items-center gap-1.5 px-2 py-1.5 rounded transition-colors"
						>
							<Trash2 className="w-3.5 h-3.5" /> Delete Agent
						</Button>
					) : (
						<div></div>
					)}

					<div className="flex items-center gap-3">
						<Button
							onClick={onClose}
							className="px-4 py-2 text-xs font-medium transition-colors"
						>
							Cancel
						</Button>
						<Button
							onClick={() => onSave(formData)}
							className="px-4 py-2 rounded-md text-xs font-medium flex items-center gap-2 shadow-sm transition-transform active:scale-95"
						>
							<Save className="w-3.5 h-3.5" />
							{formData.id ? 'Save Changes' : 'Create Agent'}
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default ConfigModal;
