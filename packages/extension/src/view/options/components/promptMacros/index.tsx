/**
 * External dependencies.
 */
import { useState, useEffect, useCallback } from 'react';
import { PromptMacrosTab as PromptMacrosUI, type PromptMacro } from '@google-awlt/design-system';

export function PromptMacrosTab() {
    const [macros, setMacros] = useState<PromptMacro[]>([]);

    useEffect(() => {
        chrome.storage.local.get(['promptMacros'], (result) => {
            if (result.promptMacros && Array.isArray(result.promptMacros)) {
                setMacros(result.promptMacros);
            }
        });
    }, []);

    const saveMacros = useCallback((newMacros: PromptMacro[]) => {
        setMacros(newMacros);
        chrome.storage.local.set({ promptMacros: newMacros });
    }, []);

    return (
        <PromptMacrosUI
            macros={macros}
            onSaveMacros={saveMacros}
        />
    );
}
