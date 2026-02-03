# Chrome AI Playground

A React component library for visualizing and interacting with Chrome's built-in AI APIs. This package provides components to check API status and experiment with various AI features.

## Installation

```bash
pnpm add @google-awlt/chrome-ai-playground
```

## Features

- **API Status**: Visual dashboard to check the availability and status of Chrome's built-in AI capabilities.
- **API Playgrounds**: Interactive environments for testing different AI APIs, including:
  - Prompt API
  - Summarization
  - Writer's Studio
  - Proofreader
  - Polyglot Panel

## Usage

Import the components and use them in your React application:

```tsx
import {
  APIPlaygroundsTab,
  APIStatusTab,
} from '@google-awlt/chrome-ai-playground';

function App() {
  return (
    <div>
      <h1>Chrome AI Status</h1>
      <APIStatusTab />

      <h1>AI Playgrounds</h1>
      <APIPlaygroundsTab />
    </div>
  );
}
```

## Development

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Build the package:
   ```bash
   pnpm build
   ```
