
import { validateCode } from './validateCode';

const invalidCode = `export const metadata = {
    name: "new_tool",
    namespace: "user_scripts",
    version: "1.0.0",
    description: "Description of your tool",
    match: ["<all_urls>"],
    inputSchema: {
        type: "object",
        properties: {}
        additionalProperties: false
    }
};`;

const result = validateCode(invalidCode);
console.log(result);
