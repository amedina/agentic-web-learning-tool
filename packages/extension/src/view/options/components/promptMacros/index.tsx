/**
 * External dependencies.
 */
import { useState, useEffect, useCallback } from 'react';
import { PromptMacrosTab as PromptMacrosUI, type PromptMacro } from '@google-awlt/design-system';

const BUILT_IN_MACROS: PromptMacro[] = [
    {
        name: 'fix-bugs',
        description: 'Analyze code for bugs and propose fixes.',
        instructions: 'Analyze the following code for bugs or potential issues and provide a fixed version:\n\n$ARGUMENTS',
        isBuiltIn: true
    },
    {
        name: 'explain-code',
        description: 'Explain code step-by-step.',
        instructions: 'Explain how the following code works step-by-step:\n\n$ARGUMENTS',
        isBuiltIn: true
    },
    {
        name: 'optimize',
        description: 'Optimize code for performance/readability.',
        instructions: 'Optimize the following code for performance and readability:\n\n$ARGUMENTS',
        isBuiltIn: true
    },
    {
        name: 'generate-tests',
        description: 'Write unit tests for code.',
        instructions: 'Write comprehensive unit tests for the following code using preferred testing framework:\n\n$ARGUMENTS',
        isBuiltIn: true
    }
];

export function PromptMacrosTab() {
    const [userMacros, setUserMacros] = useState<PromptMacro[]>([]);

    useEffect(() => {
        chrome.storage.local.get(['promptMacros'], (result) => {
            if (result.promptMacros && Array.isArray(result.promptMacros)) {
                setUserMacros(result.promptMacros);
            }
        });
    }, []);

    const saveMacros = useCallback((newMacros: PromptMacro[]) => {
        setUserMacros(newMacros);
        chrome.storage.local.set({ promptMacros: newMacros });
    }, []);

    return (
        <PromptMacrosUI
            userMacros={userMacros}
            builtInMacros={BUILT_IN_MACROS}
            onSaveMacros={saveMacros}
        />
    );
}
