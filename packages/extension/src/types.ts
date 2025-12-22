export type AgentType = {
	id: string;
	name: string;
	apiKey: string;
	providerUrl: string;
	temperature: number;
	maxTokens: number;
	thinkingMode: boolean;
	extraConfig: string;
	status: boolean;
	model: string;
	modelProvider: string;
	reasoningEffort?: string;
	reasoningSummary?: string;
}
