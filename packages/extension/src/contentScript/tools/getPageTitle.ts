export default {
    name: "get_page_title",
    description: "Get page title",
    allowedDomains: ["<all_urls>"],
    inputSchema: { type: "object", properties: {} },
    execute: async () => {
        console.log("WebMCP: Executing get_page_title");
        // WORKAROUND: Return string directly to avoid [object Object] from Native API
        return "Page Title: " + document.title;
    }
};
