import os
import time
import subprocess
import sys
from playwright.sync_api import sync_playwright

def verify_api_status():
    dist_path = os.path.abspath("dist/extension")
    port = 8080
    server_process = subprocess.Popen(
        [sys.executable, "-m", "http.server", str(port)],
        cwd=dist_path,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL
    )

    print(f"Started server on port {port}")
    time.sleep(2)

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()

            page.on("console", lambda msg: print(f"Console: {msg.text}"))
            page.on("pageerror", lambda err: print(f"Page Error: {err}"))

            url = f"http://localhost:{port}/options/options.html"
            print(f"Navigating to {url}")

            page.add_init_script("""
                const noop = () => {};
                const mockListener = {
                    addListener: noop,
                    removeListener: noop,
                    hasListener: () => false
                };

                // Base chrome mock
                const chromeMock = {
                    runtime: {
                        onMessage: mockListener,
                        onConnect: mockListener,
                        onInstalled: mockListener,
                        onStartup: mockListener,
                        onSuspend: mockListener,
                        sendMessage: (msg) => Promise.resolve({ status: 'ok' }),
                        reload: () => console.log('Reload triggered'),
                        getManifest: () => ({ version: '0.0.0' }),
                        id: 'mock-extension-id',
                        getURL: (path) => path,
                        connect: () => ({ onMessage: mockListener, onDisconnect: mockListener, postMessage: noop })
                    },
                    storage: {
                        local: {
                            get: (keys, cb) => {
                                const data = { theme: 'light' };
                                if(cb) cb(data);
                                return Promise.resolve(data);
                            },
                            set: (data, cb) => { if(cb) cb(); return Promise.resolve(); },
                            remove: () => Promise.resolve(),
                            clear: () => Promise.resolve(),
                            getBytesInUse: (key, cb) => {
                                const bytes = 1024 * 500;
                                if(cb) cb(bytes);
                                return Promise.resolve(bytes);
                            },
                            onChanged: mockListener
                        },
                        sync: {
                            get: (keys, cb) => { if(cb) cb({}); return Promise.resolve({}); },
                            set: () => Promise.resolve(),
                            onChanged: mockListener
                        },
                        session: {
                            get: (keys, cb) => { if(cb) cb({}); return Promise.resolve({}); },
                            set: () => Promise.resolve(),
                            onChanged: mockListener
                        },
                        onChanged: mockListener
                    },
                    sidePanel: {
                        setPanelBehavior: () => Promise.resolve()
                    },
                    userScripts: {},
                    commands: {
                        getAll: (cb) => { if(cb) cb([]); return Promise.resolve([]); }
                    },
                    i18n: {
                        getMessage: (key) => key
                    },
                    tabs: {
                        query: (q, cb) => { if(cb) cb([]); return Promise.resolve([]); },
                        create: () => Promise.resolve(),
                        onActivated: mockListener,
                        onUpdated: mockListener
                    },
                    permissions: {
                        contains: (p, cb) => { if(cb) cb(true); return Promise.resolve(true); }
                    },
                    windows: {
                        onFocusChanged: mockListener
                    },
                    devtools: {
                         panels: { create: () => {} }
                    },
                    contextMenus: {
                        create: () => {},
                        onClicked: mockListener
                    },
                    action: {
                        onClicked: mockListener
                    }
                };

                window.chrome = chromeMock;

                window.matchMedia = window.matchMedia || function() {
                    return {
                        matches: false,
                        addListener: function() {},
                        removeListener: function() {},
                        addEventListener: function() {},
                        removeEventListener: function() {}
                    };
                };

                window.ai = {
                    languageModel: {
                        capabilities: () => Promise.resolve({ available: 'readily' })
                    },
                    writer: { capabilities: () => Promise.resolve({ available: 'readily' }) },
                    rewriter: { capabilities: () => Promise.resolve({ available: 'readily' }) },
                    summarizer: { capabilities: () => Promise.resolve({ available: 'readily' }) },
                    translator: { capabilities: () => Promise.resolve({ available: 'no' }) },
                    proofreader: { capabilities: () => Promise.resolve({ available: 'readily' }) },
                    languageDetector: { capabilities: () => Promise.resolve({ available: 'readily' }) }
                };

                 Object.defineProperty(navigator, 'deviceMemory', { get: () => 8 });
                 Object.defineProperty(navigator, 'storage', {
                    get: () => ({ estimate: () => Promise.resolve({ quota: 10000000000, usage: 500000000 }) })
                });
            """)

            page.goto(url)

            time.sleep(2)

            try:
                page.get_by_text("API Status", exact=False).first.click()
                time.sleep(1)
            except Exception as e:
                print(f"Error clicking API Status: {e}")

            screenshot_path = os.path.abspath("verification/api_status.png")
            page.screenshot(path=screenshot_path, full_page=True)
            print(f"Screenshot saved to {screenshot_path}")

            browser.close()

    finally:
        server_process.kill()

if __name__ == "__main__":
    verify_api_status()
