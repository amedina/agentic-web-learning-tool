export default {
	name: 'change_bg_color',
	description: 'Changes background color',
	allowedDomains: ['<all_urls>'],
	inputSchema: { type: 'object', properties: { color: { type: 'string' } } },
	execute: async (args: any) => {
		console.log('WebMCP: Executing change_bg_color', args);
		const color = args.color || 'red';
		document.body.style.backgroundColor = color;
		// WORKAROUND: Return string directly to avoid [object Object] from Native API
		return `Changed background to ${color}`;
	},
};
