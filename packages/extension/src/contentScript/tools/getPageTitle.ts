export default {
  name: 'get_page_title',
  description: 'Gets page title of the current page',
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

export const stringifiedGetPageTitle = `export const metadata = {
  name: 'get_page_title',
  description: 'Gets page title of the current page',
  allowedDomains: ['<all_urls>'],
  inputSchema: { type: 'object', properties: {} },
};

export async function execute(args) {
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
}
`;
