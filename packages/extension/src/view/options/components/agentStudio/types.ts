export type AgentType = {
	id: string;
	name: string;
	apiKey: string;
	providerUrl: string;
	temperature: number;
	maxTokens: number;
	thinkingMode: boolean;
	extraConfig: string;
	model: string;
	reasoningEffort?: string;
	reasoningSummary?: string;
}