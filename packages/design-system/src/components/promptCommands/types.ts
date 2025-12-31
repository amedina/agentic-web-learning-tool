export interface PromptCommand {
    name: string;
    instructions: string;
    description?: string;
    isBuiltIn?: boolean;
    enabled?: boolean;
}
