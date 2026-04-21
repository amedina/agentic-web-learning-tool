# Privacy Policy — NPM Advisor

**Last updated:** April 6, 2026

## Overview

NPM Advisor ("the Extension") is a Chrome extension that provides package intelligence, security insights, and AI-powered analysis for npm packages. This privacy policy explains how the Extension handles user data.

## Data Collection and Storage

### Data Stored Locally on Your Device

The Extension stores the following data locally using Chrome's storage APIs (`chrome.storage.local` and `chrome.storage.sync`):

- **API keys** you provide for third-party AI model providers (Anthropic, OpenAI, Google Gemini).
- **Extension preferences** such as theme settings, target license configuration, and feature toggles.
- **Comparison bucket** — the list of packages you add for side-by-side comparison.

All of this data is stored locally on your device (or synced via your Google account through `chrome.storage.sync` for settings and API keys). The Extension does not operate its own servers and does not collect or store any of your data on external infrastructure controlled by the Extension developers.

### Data Not Collected

The Extension does **not** collect:

- Personal identifying information (name, email, address, etc.)
- Browsing history beyond the npm and GitHub pages you visit where the Extension activates
- Analytics, telemetry, or usage statistics
- Cookies or tracking identifiers

## Data Usage

All stored data is used exclusively to provide the Extension's core functionality:

- **API keys** are used solely to authenticate requests to the AI model providers you configure.
- **Extension preferences** are used to personalize the Extension's appearance and behavior.
- **Comparison bucket** is used to persist your package comparison selections across sessions.

## Data Shared with Third Parties

The Extension sends data to third-party services **only when you explicitly initiate an action** that requires it, or when the Extension activates on a supported page (npmjs.com or a GitHub `package.json` file):

- **npm Registry** (`registry.npmjs.org`): Package names are sent to retrieve package metadata such as versions, maintainers, dependencies, and license information.
- **GitHub API** (`api.github.com`): Repository owner and name are sent to retrieve repository statistics, issue metrics, and security advisories for the packages you view.
- **Bundlephobia** (`bundlephobia.com`): Package names are sent to retrieve bundle size and tree-shaking analysis.
- **GitHub Raw Content** (`raw.githubusercontent.com`): Static manifest files are fetched to provide module replacement recommendations. No user data is sent.
- **AI model providers** (Anthropic, OpenAI, Google Gemini): Your API key and message content are sent to the provider you select when you use the AI chat feature. These requests are governed by the respective provider's privacy policy.

The Extension **never** shares, sells, or transfers user data for:

- Advertising, including personalized or interest-based advertising
- Creditworthiness or lending assessments
- Any purpose unrelated to the Extension's core functionality

## Permissions Explained

The Extension requests the following Chrome permissions, each necessary for its core features:

| Permission | Purpose |
|---|---|
| `storage`, `unlimitedStorage` | Store your settings, API keys, comparison selections, and cached package data locally |
| `activeTab` | Detect when you visit npm or GitHub pages to activate the Extension's features |
| `sidePanel` | Display the package analysis interface in the browser side panel |
| `webNavigation` | Monitor page navigation to activate the Extension on relevant pages |
| `host_permissions` (npm, GitHub, Bundlephobia) | Fetch package metadata, repository statistics, security advisories, and bundle size data from these services |

## Data Security

- All network requests to npm, GitHub, Bundlephobia, and AI model providers are transmitted over HTTPS.
- API keys and tokens are stored using Chrome's built-in storage APIs.
- No data is transmitted to any server without explicit user action or the Extension activating on a supported page.

## Data Retention and Deletion

- All data is retained locally until you delete it.
- You can clear your comparison bucket and preferences through the Extension's options page.
- You can perform a full data reset from the Extension's options page, which clears all stored data.
- Uninstalling the Extension removes all locally stored data.

## Data Export

The Extension provides a settings export feature that generates a JSON backup file saved to your local downloads folder. This file may contain API keys in plaintext. Handle exported files with care.

## Changes to This Policy

We may update this privacy policy from time to time. Changes will be reflected in the "Last updated" date at the top of this document.

## Contact

If you have questions about this privacy policy, please open an issue on the project's [GitHub repository](https://github.com/amedina/agentic-web-learning-tool).
