export default {
  name: 'change_bg_color',
  description: 'Changes background color of the current page',
  allowedDomains: ['<all_urls>'],
  inputSchema: { type: 'object', properties: { color: { type: 'string' } } },
  execute: async (args: any) => {
    console.log('WebMCP: Executing change_bg_color', args);
    const color = args.color || 'red';
    document.body.style.backgroundColor = color;

    return {
      content: [
        {
          type: 'text',
          text: `Changed background to ${color}`,
        },
      ],
      isError: false,
    };
  },
};
