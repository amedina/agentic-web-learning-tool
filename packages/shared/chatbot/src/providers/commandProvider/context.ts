/**
 * External dependencies
 */
import { noop, createContext } from '@agentic-web-labs/common';
import type { PromptCommand } from '@agentic-web-labs/design-system';

export interface CommandProviderContextType {
  state: {
    allCommands: PromptCommand[];
  };
  actions: {
    handleMessageChange: (
      event:
        | React.KeyboardEvent<HTMLTextAreaElement>
        | React.MouseEvent<HTMLButtonElement, MouseEvent>
    ) => void;
  };
}

const initialState: CommandProviderContextType = {
  state: {
    allCommands: [],
  },
  actions: {
    handleMessageChange: noop,
  },
};

export default createContext<CommandProviderContextType>(initialState);
