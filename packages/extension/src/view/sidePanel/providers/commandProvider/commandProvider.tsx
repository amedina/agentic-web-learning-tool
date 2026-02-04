/**
 * External dependencies.
 */
import {
  type PropsWithChildren,
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
} from 'react';
import { useAssistantApi } from '@assistant-ui/react';
import type { PromptCommand } from '@google-awlt/design-system';

/**
 * Internal dependencies.
 */
import Context from './context';
import { BUILT_IN_COMMANDS } from '../../../../constants';

const Provider = ({ children }: PropsWithChildren) => {
  const [allCommands, setAllCommands] = useState<PromptCommand[]>([]);
  const api = useAssistantApi();

  const initialFetchDone = useRef<boolean>(false);

  const intitialSync = useCallback(async () => {
    chrome.storage.local.get(
      ['promptCommands', 'builtInPromptCommands'],
      (result) => {
        const userCommands = (result.promptCommands as PromptCommand[]) || [];
        const storedBuiltIns =
          (result.builtInPromptCommands as PromptCommand[]) || [];

        const mergedBuiltIns = BUILT_IN_COMMANDS.map((m) => {
          const found = storedBuiltIns.find((s) => s.name === m.name);
          return { ...m, enabled: found ? found.enabled : true };
        });

        setAllCommands([...userCommands, ...mergedBuiltIns]);
        initialFetchDone.current = true;
      }
    );
  }, []);

  const extractMatchAndReturnMessage = useCallback(
    (currentValue: string) => {
      const match = currentValue.match(/^\/([\w.-]+)(?:\s+(.*))?$/);
      if (match) {
        const commandName = match[1];
        const command = allCommands.find(
          (m) => m.name === commandName && m.enabled
        );
        if (command && command?.instructions.includes('$ARGUMENTS')) {
          let expansion = command.instructions;
          expansion = expansion.replaceAll('$ARGUMENTS', match[2] ?? '');

          if (command.isBuiltIn && !command.sendToLLM) {
            //@ts-expect-error -- this is being done to avoid delays for communication with LLM transports.
            window.command = command.name;
          }

          return expansion;
        } else if (command && !command?.instructions.includes('$ARGUMENTS')) {
          if (command.isBuiltIn && !command.sendToLLM) {
            //@ts-expect-error -- this is being done to avoid delays for communication with LLM transports.
            window.command = command.name;
          }
          return command.instructions.trim().length > 1
            ? command.instructions.trim()
            : `/${command.name}`;
        }
      }
    },
    [allCommands]
  );

  const handleMessageChange = useCallback(
    (
      event:
        | React.KeyboardEvent<HTMLTextAreaElement>
        | React.MouseEvent<HTMLButtonElement>
    ) => {
      if (event.type === 'click') {
        event.preventDefault();
        const currentValue = api.composer().getState().text;
        const finalText = extractMatchAndReturnMessage(currentValue);
        if (!finalText) {
          return;
        }
        api.composer().setText(finalText);
        setTimeout(() => {
          api.composer().send();
        }, 1000);

        return;
      }

      if ((event as React.KeyboardEvent<HTMLTextAreaElement>).key === 'Enter') {
        const currentValue = api.composer().getState().text;
        const finalText = extractMatchAndReturnMessage(currentValue);
        if (!finalText) {
          return;
        }
        api.composer().setText(finalText);
      }
    },
    [api, extractMatchAndReturnMessage]
  );

  const onLocalStorageChangedListener = useCallback(
    async (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (!changes?.builtInPromptCommands && !changes?.promptCommands) {
        return;
      }

      chrome.storage.local.get(
        ['promptCommands', 'builtInPromptCommands'],
        (result) => {
          const userCommands = (result.promptCommands as PromptCommand[]) || [];
          const storedBuiltIns =
            (result.builtInPromptCommands as PromptCommand[]) || [];

          const mergedBuiltIns = BUILT_IN_COMMANDS.map((m) => {
            const found = storedBuiltIns.find((s) => s.name === m.name);
            return { ...m, enabled: found ? found.enabled : true };
          });

          setAllCommands([...userCommands, ...mergedBuiltIns]);
        }
      );
    },
    []
  );

  useEffect(() => {
    intitialSync();
    chrome.storage.local.onChanged.addListener(onLocalStorageChangedListener);
    return () => {
      chrome.storage.local.onChanged.removeListener(
        onLocalStorageChangedListener
      );
    };
  }, [intitialSync, onLocalStorageChangedListener]);

  const memoisedValue = useMemo(() => {
    return {
      state: {
        allCommands,
      },
      actions: {
        handleMessageChange,
      },
    };
  }, [allCommands, handleMessageChange]);

  return <Context.Provider value={memoisedValue}>{children}</Context.Provider>;
};

export default Provider;
