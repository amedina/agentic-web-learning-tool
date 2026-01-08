/**
 * External dependencies.
 */
import { useState, useEffect, useCallback } from 'react';
import { PromptCommandsTab as PromptCommandsUI, type PromptCommand } from '@google-awlt/design-system';
import { BUILT_IN_COMMANDS } from '../../../../constants';

export function PromptCommandsTab() {
    const [userCommands, setUserCommands] = useState<PromptCommand[]>([]);
    const [builtInCommands, setBuiltInCommands] = useState<PromptCommand[]>(BUILT_IN_COMMANDS);

    useEffect(() => {
        chrome.storage.local.get(['promptCommands', 'builtInPromptCommands'], (result) => {
            if (result.promptCommands && Array.isArray(result.promptCommands)) {
                setUserCommands(result.promptCommands);
            }

            if (result.builtInPromptCommands && Array.isArray(result.builtInPromptCommands)) {
                const stored = result.builtInPromptCommands as PromptCommand[];
                const merged = BUILT_IN_COMMANDS.map((m) => {
                    const found = stored.find((s) => s.name === m.name);
                    return { ...m, enabled: found ? found.enabled : true };
                });
                setBuiltInCommands(merged);
            }
        });
    }, []);

    const saveCommands = useCallback((newCommands: PromptCommand[]) => {
        setUserCommands(newCommands);
        chrome.storage.local.set({ promptCommands: newCommands });
    }, []);

    const saveBuiltInState = useCallback((newCommands: PromptCommand[]) => {
        setBuiltInCommands(newCommands);
        chrome.storage.local.set({ builtInPromptCommands: newCommands });
    }, []);

    return (
        <PromptCommandsUI
            userCommands={userCommands}
            builtInCommands={builtInCommands}
            onSaveCommands={saveCommands}
            onSaveBuiltInState={saveBuiltInState}
        />
    );
}
