/**
 * External dependencies.
 */
import { useState, useEffect, useCallback } from 'react';
import { PromptMacrosTab as PromptMacrosUI, type PromptMacro } from '@google-awlt/design-system';
import { BUILT_IN_MACROS } from '../../../../constants';

export function PromptMacrosTab() {
    const [userMacros, setUserMacros] = useState<PromptMacro[]>([]);
    const [builtInMacros, setBuiltInMacros] = useState<PromptMacro[]>(BUILT_IN_MACROS);

    useEffect(() => {
        chrome.storage.local.get(['promptMacros', 'builtInPromptMacros'], (result) => {
            if (result.promptMacros && Array.isArray(result.promptMacros)) {
                setUserMacros(result.promptMacros);
            }

            if (result.builtInPromptMacros && Array.isArray(result.builtInPromptMacros)) {
                const stored = result.builtInPromptMacros as PromptMacro[];
                const merged = BUILT_IN_MACROS.map((m) => {
                    const found = stored.find((s) => s.name === m.name);
                    return { ...m, enabled: found ? found.enabled : true };
                });
                setBuiltInMacros(merged);
            }
        });
    }, []);

    const saveMacros = useCallback((newMacros: PromptMacro[]) => {
        setUserMacros(newMacros);
        chrome.storage.local.set({ promptMacros: newMacros });
    }, []);

    const saveBuiltInState = useCallback((newMacros: PromptMacro[]) => {
        setBuiltInMacros(newMacros);
        chrome.storage.local.set({ builtInPromptMacros: newMacros });
    }, []);

    return (
        <PromptMacrosUI
            userMacros={userMacros}
            builtInMacros={builtInMacros}
            onSaveMacros={saveMacros}
            onSaveBuiltInState={saveBuiltInState}
        />
    );
}
