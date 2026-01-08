/**
 * Internal dependencies
 */
import { logger } from '../../utils';
import { configureTabPanel } from '../utils';

const tabOnActivatedCallback = async (
	activeInfo: chrome.tabs.OnActivatedInfo
) => {
	try {
		await configureTabPanel(activeInfo.tabId);
	} catch (error) {
		logger(
			['debug'],
			[
				'Could not pre-configure panel for activated tab:',
				activeInfo.tabId,
				error,
			]
		);
	}
};

export default tabOnActivatedCallback;
