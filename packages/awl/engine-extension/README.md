# Engine Extension

This package is the glue that connects our core engine to the Chrome Extension. It handles the "under the hood" communication required to make things feel seamless for the user.

### What it does

- **Bridging:** It manages the handshake between the background service worker, and the content script running on a webpage.
- **Lifecycles:** It understands how extensions work, handling things like storage, tab updates, and message passing.
- **Browser Context:** It lets the engine talk to the browser in a way that’s safe and efficient within the extension sandbox.
