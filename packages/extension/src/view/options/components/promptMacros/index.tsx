/**
 * External dependencies.
 */
import { useState, useEffect, useCallback } from 'react';
import { PromptMacrosTab as PromptMacrosUI, type PromptMacro } from '@google-awlt/design-system';

const BUILT_IN_MACROS: PromptMacro[] = [
    {
        name: 'fix-bugs',
        description: 'Analyze code for bugs and propose fixes.',
        instructions:
            'Analyze the following code for bugs or potential issues and provide a fixed version:\n\n$ARGUMENTS',
        isBuiltIn: true,
        enabled: true
    },
    {
        name: 'explain-code',
        description: 'Explain code step-by-step.',
        instructions: 'Explain how the following code works step-by-step:\n\n$ARGUMENTS',
        isBuiltIn: true,
        enabled: true
    },
    {
        name: 'optimize',
        description: 'Optimize code for performance/readability.',
        instructions: 'Optimize the following code for performance and readability:\n\n$ARGUMENTS',
        isBuiltIn: true,
        enabled: true
    },
    {
        name: 'generate-tests',
        description: 'Write unit tests for code.',
        instructions:
            'Write comprehensive unit tests for the following code using preferred testing framework:\n\n$ARGUMENTS',
        isBuiltIn: true,
        enabled: true
    }
];

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
