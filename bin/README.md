# Chrome AI Launcher Setup Script

This project provides a Bash script (`install.sh`) to set up convenient aliases/functions for launching your system's installed Chrome with specific configurations, including support for AI features and the Model Context Protocol (MCP) proxy.

## Features

*   **System Chrome Detection:** Automatically detects and uses your system's installed Chrome (prioritizing Dev, Canary, then Stable channels).
*   **Persistent AI Profile:** Uses a persistent profile directory (`$HOME/.chrome-ai-profile`) to preserve your settings and data.
*   **Smart Aliases:** Generates a `chrome_launcher.sh` script with the following commands:
    *   `chrome-ai`: Launches System Chrome with AI features enabled and remote debugging.
    *   `chrome-mcp-proxy`: Starts a standalone MCP proxy server connecting to an existing Chrome instance.

## Prerequisites

Ensure the following tools are installed on your system:

*   `jq`
*   `Node.js`, `npm`
*   `chrome-devtools-mcp` and `mcp-proxy` (installed globally via npm for `chrome-mcp-proxy`)

### Installation Instructions

#### Ubuntu / Debian Linux

```bash
sudo apt update
sudo apt install -y curl jq nodejs npm
sudo npm install -g chrome-devtools-mcp mcp-proxy
```

#### macOS

Using [Homebrew](https://brew.sh/):

```bash
brew install jq node
npm install -g chrome-devtools-mcp mcp-proxy
```

## Installation

1.  Clone this repository or download the `install.sh` script.
2.  Make the script executable:
    ```bash
    chmod +x install.sh
    ```
3.  Run the installation script:
    ```bash
    ./install.sh
    ```

### Custom Installation Options

You can override defaults using command-line arguments:

*   `--uninstall`: Remove the generated script and aliases.

## Usage

After installation, the script will automatically add a source command to your shell profile (`.bashrc` or `.zshrc`). Reload your shell or run the command manually to start using the aliases:

```bash
source "$HOME/bin/chrome_launcher.sh"
```

### Commands

#### `chrome-ai`

Launches your system's installed Chrome (looking for Dev, Canary, then Stable) with a persistent profile and enabled AI features (Gemini Nano, Prompt API, etc.).

*   **Remote Debugging:** Automatically enables remote debugging on port `9222` (or the next available port), allowing you to connect external tools.
*   **Port Management:** Automatically checks if the port is available and suggests alternatives if it is in use.

#### `chrome-mcp-proxy`

Starts a standalone MCP proxy server that connects to an existing Chrome instance (e.g., one started with `chrome-ai`).

*   **Usage:** `chrome-mcp-proxy [debug_port]`
*   **Default Port:** Connects to Chrome on port `9222` by default. You can specify a different port as an argument.
*   **Proxy Port:** Automatically finds an available port starting from `3000`.
*   **Dependencies:** Checks for required npm packages (`mcp-proxy`, `chrome-devtools-mcp`) at runtime.
