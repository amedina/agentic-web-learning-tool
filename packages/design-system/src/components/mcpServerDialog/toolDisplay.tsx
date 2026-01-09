/**
 * External dependencies.
 */
import type { Tool } from '@modelcontextprotocol/sdk/types.js';

/**
 * Internal dependencies.
 */
import Accordion from '../accordion';

interface ToolDisplayProps {
  toolList: Tool[];
}

export function ToolDisplay({ toolList = [] }: ToolDisplayProps) {
  return (
    <div className="flex flex-col text-foreground">
      {toolList.map((tool) => {
        return (
          <Accordion
            key={tool.name}
            triggerText={tool.name}
            type="single"
            collapsible
          >
            <div className="mb-1 w-full text-foreground">
              <span className="font-bold">Tool Description:</span>
              <span>{tool.description}</span>
            </div>
            <div className="w-full text-foreground">
              <span className="font-bold">Tool input schema:</span>
              <pre className="whitespace-pre-wrap">
                <span>{JSON.stringify(tool.inputSchema, null, 2)}</span>
              </pre>
            </div>
          </Accordion>
        );
      })}
    </div>
  );
}
