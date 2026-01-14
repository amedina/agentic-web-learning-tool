export default {
  name: 'get_page_title',
  description: 'Get page title',
  allowedDomains: ['<all_urls>'],
  inputSchema: { type: 'object', properties: {} },
  execute: async () => {
    console.log('WebMCP: Executing get_page_title');

    return {
      content: [
        {
          type: 'text',
          text: document.title,
        },
      ],
      isError: false,
    };
  },
};
