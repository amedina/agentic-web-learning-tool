export const INITIAL_PROVIDERS = [
  {
    id: "gemini",
    name: "Gemini",
    models: [
      { id: "gemini-2.5-pro", label: "gemini-2.5-pro", thinking: true },
      { id: "gemini-2.5-flash", label: "gemini-2.5-flash", thinking: true },
      { id: "gemini-2.0-flash", label: "gemini-2.0-flash", thinking: true },
      { id: "gemini-1.5-pro", label: "gemini-1.5-pro" },
      { id: "gemini-1.5-flash", label: "gemini-1.5-flash" },
    ],
  },
  {
    id: "open-ai",
    name: "OpenAI",
    models: [
      { id: "gpt-4o", label: "gpt-4o" },
      { id: "gpt-4o-mini", label: "gpt-4o-mini" },
      { id: "gpt-4.1", label: "gpt-4.1" },
      { id: "gpt-4.1-mini", label: "gpt-4.1-mini" },
      { id: "gpt-5", label: "gpt-5", thinking: true },
    ],
  },
  {
    id: "anthropic",
    name: "Anthropic",
    models: [
      { id: "claude-sonnet-4-6", label: "Claude Sonnet 4.6", thinking: true },
      { id: "claude-opus-4-6", label: "Claude Opus 4.6", thinking: true },
      {
        id: "claude-haiku-4-5-20251001",
        label: "Claude Haiku 4.5",
        thinking: true,
      },
    ],
  },
];
