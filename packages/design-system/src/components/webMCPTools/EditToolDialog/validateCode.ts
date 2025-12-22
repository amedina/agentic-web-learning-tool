
export const validateCode = (currentCode: string): { valid: boolean; error?: string } => {
    try {
        const hasMetadata = /export\s+const\s+metadata\s*=\s*{/.test(currentCode);
        const hasExecute = /export\s+async\s+function\s+execute/.test(currentCode);

        if (!hasMetadata) throw new Error("Missing 'export const metadata = { ... }'");
        if (!hasExecute) throw new Error("Missing 'export async function execute(args) { ... }'");

        return { valid: true };
    } catch (e: any) {
        return { valid: false, error: e.message };
    }
};
