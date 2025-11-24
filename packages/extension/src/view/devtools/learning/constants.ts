import { SIDEBAR_ITEMS_KEYS } from '@google-awlt/design-system';
import { HammerIcon } from 'lucide-react';

export const LEARNING_BOX_ITEMS = [
	{
		name: 'Dev Site',
		icon: HammerIcon,
		sidebarKey: SIDEBAR_ITEMS_KEYS.DEV_SITE,
		title: 'Ready to start developing with the Privacy Sandbox?',
		description:
			'Privacy Sandbox Dev Site is your central hub for all developer resources.  Dive deep into comprehensive documentation covering every aspect of the Privacy Sandbox, from foundational concepts to advanced API usage.  Go on exploring in the current browser tab to the left.',
		colorClasses: {
			heading: 'text-red-700',
		},
	},
];
