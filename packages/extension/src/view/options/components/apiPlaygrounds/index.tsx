/**
 * External dependencies
 */
import { OptionsPageTab } from '@google-awlt/design-system';
import { useState } from 'react';
import {
  Terminal,
  PenTool,
  FileText,
  Languages,
  Activity,
  ArrowLeft,
} from 'lucide-react';

import PromptLab from './PromptLab';

interface PlaygroundCard {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
}

const CARDS: PlaygroundCard[] = [
  {
    id: 'prompt-lab',
    title: 'Prompt Lab',
    description:
      'Experiment with raw LLM sessions and prompt engineering parameters.',
    icon: Terminal,
  },
  {
    id: 'writers-studio',
    title: "Writer's Studio",
    description:
      'Specialized generation and refinement tools for content creation.',
    icon: PenTool,
  },
  {
    id: 'summarization-station',
    title: 'Summarization Station',
    description: 'Test various summarization strategies and formats.',
    icon: FileText,
  },
  {
    id: 'polyglot-panel',
    title: 'Polyglot Panel',
    description:
      'Explore on-device translation and language detection capabilities.',
    icon: Languages,
  },
  {
    id: 'session-manager',
    title: 'Session Manager',
    description:
      'Diagnostic dashboard for active AI sessions and resource usage.',
    icon: Activity,
  },
];

export default function APIPlaygroundsTab() {
  const [activeCardId, setActiveCardId] = useState<string | null>(null);

  const activeCard = CARDS.find((c) => c.id === activeCardId);

  return (
    <OptionsPageTab
      title="Playground"
      description="Interactive sandbox for Chrome's built-in Gemini Nano models."
    >
      {activeCard ? (
        <div className="space-y-6">
          {/* Header with back button */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveCardId(null)}
              className="p-2 hover:bg-accent rounded-full transition-colors cursor-pointer"
              aria-label="Back to playground"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-3">
              <activeCard.icon className="w-8 h-8 text-primary" />
              <h2 className="text-2xl font-semibold">{activeCard.title}</h2>
            </div>
          </div>

          {activeCard.id === 'prompt-lab' ? (
            <PromptLab />
          ) : (
            /* Content Placeholder */
            <div className="flex flex-col items-center justify-center min-h-[400px] border-2 border-dashed border-muted-foreground/25 rounded-xl bg-muted/50 p-8">
              <div className="text-center space-y-2">
                <p className="text-xl font-medium text-muted-foreground">
                  Coming Soon
                </p>
                <p className="text-sm text-muted-foreground/80 max-w-md">
                  The {activeCard.title} module is currently under development.
                  Check back soon for updates!
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {CARDS.map((card) => (
            <button
              key={card.id}
              onClick={() => setActiveCardId(card.id)}
              className="flex flex-col text-left p-6 rounded-xl border bg-card hover:bg-accent/50 hover:border-primary/50 transition-all duration-200 group h-full cursor-pointer shadow-sm hover:shadow-md"
            >
              <div className="flex items-start justify-between mb-4 w-full">
                <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <card.icon className="w-6 h-6 text-primary" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                {card.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {card.description}
              </p>
            </button>
          ))}
        </div>
      )}
    </OptionsPageTab>
  );
}
