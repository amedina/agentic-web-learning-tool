console.log("hello world");

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    if (request.type === "getWebMCPScripts") {
        chrome.storage.local.get(["webmcp_user_scripts"], (result) => {
            sendResponse(result["webmcp_user_scripts"] || []);
        });
        return true; // Keep the message channel open for async response
    }
});