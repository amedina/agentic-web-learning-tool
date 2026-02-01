/**
 * External dependencies
 */
import { type AssistantRuntime } from '@assistant-ui/react';
import { useEffect, useRef } from 'react';
import { SidebarProvider } from '@google-awlt/design-system';
/**
 * Internal dependencies
 */
import { ChatBotUI } from './components';
import { CommandProvider, useModelProvider } from './providers';
import CustomRuntimeProvider from './customRuntime/customRuntimeProvider';

const SidePanel = () => {
  const { transport } = useModelProvider(({ state }) => ({
    transport: state.transport,
  }));
  const runtimeRef = useRef<AssistantRuntime | null>(null);

  useEffect(() => {
    (async () => {
      if (!runtimeRef.current) {
        return;
      }
      runtimeRef.current.thread.reset();
      transport?.setRuntime(runtimeRef.current);
    })();
  }, [transport]);

  return (
    <CustomRuntimeProvider transport={transport} runtimeRef={runtimeRef}>
      <CommandProvider>
        <SidebarProvider defaultOpen={false}>
          <ChatBotUI runtime={runtimeRef.current} />
        </SidebarProvider>
      </CommandProvider>
    </CustomRuntimeProvider>
  );
};

export default SidePanel;
