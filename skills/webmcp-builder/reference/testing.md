# Testing WebMCP Tools

## Table of Contents
- [Manual Testing Checklist](#manual-testing-checklist)
- [Automated Evaluation with the Evals CLI](#automated-evaluation-with-the-evals-cli)
- [Browser-Based Evaluation](#browser-based-evaluation)

---

## Manual Testing Checklist

Before automating, verify these basics by hand:

1. **Feature detection**: Load the page in a browser without WebMCP support. The app should work normally — no errors, no broken UI.
2. **Schema accuracy**: Every parameter in `inputSchema` should match what `execute` actually uses. Missing or extra fields cause agent errors.
3. **UI sync**: After each tool call, the page should visually reflect the change. Click through the app after agent actions to confirm.
4. **Error messages**: Call tools with invalid inputs (wrong types, missing required fields, out-of-range values). The tool should return a helpful error string, not throw an unhandled exception.
5. **Edge cases**: Empty strings, zero values, very long inputs, special characters, duplicate calls.
6. **Optional parameters**: Call tools with only required parameters — defaults should apply correctly.

---

## Automated Evaluation with the Evals CLI

The WebMCP Evals CLI is a tool for testing WebMCP tools against AI agents. It sends prompts to an agent, captures the tool calls the agent makes, and checks them against expected results.

### How it works

1. You define a **schema** describing your tools (names, parameters, descriptions)
2. You write **eval cases** — natural language prompts paired with expected tool calls
3. The CLI sends each prompt to an AI model, which decides which tools to call
4. Results are compared against expectations using configurable matching (ordered or unordered)

### Schema file (`schema.json`)

Describes the tools available on your page. This mirrors your `inputSchema` definitions (the CLI uses the `ToolSchema` format):

```json
{
  "tools": [
    {
      "name": "add_item",
      "description": "Add an item to the cart",
      "inputSchema": {
        "type": "object",
        "properties": {
          "name": { "type": "string", "description": "Item name" },
          "quantity": { "type": "number", "description": "How many to add" }
        },
        "required": ["name"]
      }
    }
  ]
}
```

### Eval cases (`evals.json`)

Each eval is a list of messages (the conversation history) and the tool calls you expect the agent to make. The CLI supports ordered and unordered matching for tool calls.

```json
[
  {
    "messages": [
      { "role": "user", "type": "message", "content": "Add 3 apples to my cart" }
    ],
    "expectedCall": [
      {
        "functionName": "add_item",
        "arguments": { "name": "apples", "quantity": 3 }
      }
    ]
  },
  {
    "messages": [
      { "role": "user", "type": "message", "content": "Add a banana and two oranges" }
    ],
    "expectedCall": [
      {
        "unordered": [
          { "functionName": "add_item", "arguments": { "name": "banana", "quantity": 1 } },
          { "functionName": "add_item", "arguments": { "name": "oranges", "quantity": 2 } }
        ]
      }
    ]
  }
]
```

### Advanced Matching (Constraints)

You can use constraints for fuzzy matching of arguments:
- `$pattern`: Regex match
- `$contains`: Substring match
- `$gt`, `$gte`, `$lt`, `$lte`: Numeric comparisons
- `$type`: Type assertion

Example:
```json
{
  "functionName": "add_item",
  "arguments": {
    "name": { "$contains": "apple" },
    "quantity": { "$gt": 0 }
  }
}
```

### Writing good eval cases

- **Cover the happy path**: Basic messages that clearly map to one or more tool calls
- **Test ambiguity**: Messages where the agent must infer parameters
- **Test multi-step flows**: Conversations that require multiple tool calls in sequence
- **Test refusals**: Prompts that shouldn't trigger any tool call (expectedCall: null)
- **Use realistic language**: Real users say "throw in a couple bananas", not "invoke add_item with name=banana and quantity=2"

### Setting up the Evals CLI

The WebMCP Evals CLI is a standalone Node.js tool found in the [webmcp-tools](https://github.com/GoogleChromeLabs/webmcp-tools/tree/main/evals-cli) repository.

```bash
# 1. Clone the webmcp-tools repository
git clone https://github.com/GoogleChromeLabs/webmcp-tools.git

# 2. Navigate to the evals CLI directory
cd webmcp-tools/evals-cli

# 3. Install dependencies
npm install

# 4. Set up your AI backend API key (example for Gemini)
export GEMINI_API_KEY="your-api-key-here"
# For Ollama: no key needed, just ensure Ollama is running locally
# For Vercel AI SDK: export OPENAI_API_KEY="your-key"
```

### Running evals

Once installed, use the CLI scripts to run your `tools.json` and `evals.json`:

```bash
# Run schema-based evals (tests tool selection against a schema)
# Required: --tools, --evals. Optional: --backend (gemini, vercel, ollama)
npm run test:local -- --tools /path/to/your/tools.json --evals /path/to/your/evals.json

# Run browser-based evals against a live page
# Required: --url, --evals.
npm run test:browser -- --url http://localhost:3000 --evals /path/to/your/evals.json
```

The CLI supports multiple backends (`gemini`, `ollama`, `vercel`) and produces a report showing which evals passed, which failed, and what the agent actually did vs. what was expected.

---

## Browser-Based Evaluation

Schema-based evals test whether an agent makes the right tool calls given a tool definition, but they don't test whether the tool actually works in a real page. Browser-based evals go further — they run against a live page served locally, testing both tool invocation and UI synchronization together.

The evals CLI supports browser-based evaluation to load your page, connect an agent, and verify end-to-end behavior:

```bash
# Run browser-based evals against a locally served page
npm run test:browser -- --url http://localhost:3000 --evals shop-evals.json
```

### When to use browser-based evals

- **After schema-based evals pass**: Start with schema-based evals to validate tool design, then add browser-based evals to catch integration issues
- **For UI sync verification**: Confirm that tool calls actually update the DOM — not just that the agent calls the right tool
- **For multi-step flows**: Test sequences where one tool call changes the available tools or UI state that affects subsequent calls
- **For form-based tools**: Verify that `agentInvoked`/`respondWith` patterns work correctly in a real browser

### Writing browser-based eval cases

Browser-based evals follow the same format as schema-based evals, but the tools come from the live page rather than a schema file:

DOM assertions let you verify that the UI updated correctly after the tool call.
