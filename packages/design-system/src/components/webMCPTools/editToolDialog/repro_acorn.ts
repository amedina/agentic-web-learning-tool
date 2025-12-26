import * as acorn from 'acorn';

const code = `export const metadata = {
    name: "new_tool",
    namespace: "user_scripts",
    version: "1.0.0",
    description: "Description of your tool",
    match: ["<all_urls>"],
    inputSchema: {
        type: "object",
        properties: {},
        additionalProperties: false
    }
};

export async function execute(args) {
    // Your code here
    console.log("Executing tool with args:", args);
    return "Tool executed successfully";
}`;

try {
    acorn.parse(code, {
        ecmaVersion: 'latest',
        sourceType: 'module'
    });
    console.log("Valid code parsed successfully.");
} catch (e) {
    console.log("Error parsing valid code:", e.message);
}

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

try {
    acorn.parse(invalidCode, {
        ecmaVersion: 'latest',
        sourceType: 'module'
    });
} catch (e) {
    console.log("Error parsing invalid code (missing comma):", e.message);
}
