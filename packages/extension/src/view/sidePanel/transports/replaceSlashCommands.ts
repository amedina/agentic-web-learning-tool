/**
 * External dependencies
 */
import type { PromptCommand } from '@google-awlt/design-system';
import { createUIMessageStream } from 'ai';
import type { AssistantRuntime } from '@assistant-ui/react';
/**
 * Internal dependencies
 */
import { BUILT_IN_COMMANDS } from '../../../constants';
import { openOptionsPage } from '../../../utils';

const replaceSlashCommands = (_command: string, runtime: AssistantRuntime) => {
  return createUIMessageStream({
    execute: async ({ writer }) => {
      const textPartId = 'text-0';
      writer.write({ type: 'text-start', id: textPartId });

      if (_command === 'settings') {
        writer.write({
          type: 'text-delta',
          id: textPartId,
          delta: 'Opening Settings page',
        });

        setTimeout(async () => {
          await openOptionsPage();
        }, 500);
      }

      if (_command === 'help') {
        writer.write({
          type: 'text-delta',
          id: textPartId,
          delta: '##### Available Commands\n\n',
        });

        writer.write({
          type: 'text-delta',
          id: textPartId,
          delta: '###### Built-In Commands \n\n',
        });

        BUILT_IN_COMMANDS.forEach((cmd) => {
          writer.write({
            type: 'text-delta',
            id: textPartId,
            delta: '> **`/' + cmd.name + '`** - ' + cmd.description + '\n\n',
          });
        });

        writer.write({
          type: 'text-delta',
          id: textPartId,
          delta: '---\n\n',
        });

        const { promptCommands }: { promptCommands: PromptCommand[] } =
          await chrome.storage.local.get('promptCommands');

        if (promptCommands && promptCommands.length) {
          writer.write({
            type: 'text-delta',
            id: textPartId,
            delta: '###### Custom Commands \n\n',
          });

          promptCommands.forEach((cmd) => {
            writer.write({
              type: 'text-delta',
              id: textPartId,
              delta: '> **`/' + cmd.name + '`** - ' + cmd.description + '\n\n',
            });
          });
        }
      }

      if (_command === 'clear') {
        writer.write({
          type: 'text-delta',
          id: textPartId,
          delta: 'Clearing the current conversation',
        });

        setTimeout(() => {
          runtime?.thread.reset();
        }, 500);
      }

      writer.write({ type: 'text-end', id: textPartId });
      writer.write({
        type: 'finish',
        finishReason: 'stop',
      });

      //@ts-expect-error -- the command is being set from the chatbot
      window.command = '';
    },
  });
};

export default replaceSlashCommands;
