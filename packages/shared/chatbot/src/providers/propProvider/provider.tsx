/**
 * External dependencies
 */
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
/**
 * Internal dependencies
 */
import PropProviderContext, { type PropProviderType } from './context';
import type { SidePanelTabProps } from '../../../types';
import type { ChatDataType } from '../../customRuntime/types';

type PropProviderProps = PropsWithChildren & {
  footerNode: React.ReactNode;
  subHeaderNode?: React.ReactNode;
  prefixTabs?: SidePanelTabProps['extraTabs'];
  suffixTabs?: SidePanelTabProps['extraTabs'];
  allowToolCalling: boolean;
  assistantMessage?: null | (() => React.JSX.Element);
  userMessage?: null | (() => React.JSX.Element);
  editComposer?: null | (() => React.JSX.Element);
  getCustomSystemPrompt?: () => string;
  customIcon?: React.ReactNode;
  suggestions?: { text: string; prompt: string }[];
  allowChatStorage?: boolean;
  helperTextSet?: {
    title: (props: any) => string;
    description: (props: any) => string;
  };
  exportChatCallback?: (chatData: ChatDataType[], filename: string) => void;
  isOptionsPage?: boolean;
  view?: 'awl' | 'npm-advisor';
};

const TAB_PERSISTENCE_KEY = 'npmAdvisorSidepanelActiveTab';

function PropProvider({
  view,
  children,
  footerNode,
  subHeaderNode,
  prefixTabs,
  suffixTabs,
  allowToolCalling = true,
  assistantMessage,
  userMessage,
  editComposer,
  getCustomSystemPrompt,
  customIcon,
  suggestions,
  helperTextSet,
  allowChatStorage,
  exportChatCallback,
  isOptionsPage,
}: PropProviderProps) {
  const switchToNewThreadRef = useRef<(() => void) | null>(null);
  const triggerExportChatRef = useRef<(() => void) | null>(null);
  const [activeTab, setActiveTab] = useState<string>('');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    chrome.storage.local.get([TAB_PERSISTENCE_KEY], (result) => {
      if (result[TAB_PERSISTENCE_KEY]) {
        setActiveTab(result[TAB_PERSISTENCE_KEY] as string);
      }

      setIsLoaded(true);
    });
  }, []);

  useEffect(() => {
    const handleStorageChange = (
      changes: { [key: string]: chrome.storage.StorageChange },
      area: string
    ) => {
      if (area === 'local' && changes[TAB_PERSISTENCE_KEY]) {
        setActiveTab(changes[TAB_PERSISTENCE_KEY].newValue as string);
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => chrome.storage.onChanged.removeListener(handleStorageChange);
  }, []);

  const handleSetActiveTab = (tab: string) => {
    setActiveTab(tab);

    if (isLoaded) {
      chrome.storage.local.set({ [TAB_PERSISTENCE_KEY]: tab });
    }
  };

  const contextValue = useMemo<PropProviderType>(
    () => ({
      state: {
        footerNode,
        subHeaderNode,
        prefixTabs: prefixTabs ?? [],
        suffixTabs: suffixTabs ?? [],
        CustomAssistantMessageComponent: assistantMessage,
        CustomUserMessageComponent: userMessage,
        CustomEditComposerComponent: editComposer,
        allowToolCalling,
        isNPMAdvisor: view === 'npm-advisor',
        CustomIcon: customIcon,
        suggestions,
        helperTextSet,
        allowChatStorage: allowChatStorage ?? true,
        activeTab,
        isOptionsPage: isOptionsPage ?? false,
      },
      actions: {
        getCustomSystemPrompt: getCustomSystemPrompt ?? (() => ''),
        exportChatCallback: exportChatCallback ?? null,
        switchToNewThreadRef,
        triggerExportChatRef,
        setActiveTab: handleSetActiveTab,
      },
    }),
    [
      view,
      customIcon,
      footerNode,
      subHeaderNode,
      prefixTabs,
      suffixTabs,
      allowToolCalling,
      suggestions,
      helperTextSet,
      allowChatStorage,
      assistantMessage,
      userMessage,
      editComposer,
      getCustomSystemPrompt,
      exportChatCallback,
      activeTab,
      isOptionsPage,
    ]
  );

  return (
    <PropProviderContext.Provider value={contextValue}>
      {children}
    </PropProviderContext.Provider>
  );
}

export default PropProvider;
