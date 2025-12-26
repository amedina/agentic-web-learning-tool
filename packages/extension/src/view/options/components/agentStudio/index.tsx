/**
 * External dependencies
 */
import { OptionsPageTab } from '@google-awlt/design-system';

/**
 * Internal dependencies
 */
import { INITIAL_PROVIDERS } from '../../../../constants';
import SingleProviderAccordion from './singleProviderAccordion';
import { useModelProvider } from '../../providers';

export default function AgentDashboard() {
	const { apiKeys } = useModelProvider(({ state }) => ({
		apiKeys: state.apiKeys,
	}));

	return (
		<OptionsPageTab
			title="Agent Studio"
			description="Manage your LLM agents, configure connection settings, and fine-tune inference parameters."
		>
			<div className="w-full flex flex-col flex-1">
				{/* Dashboard Grid */}
				{INITIAL_PROVIDERS.filter(
					(provider) => provider.id !== 'browser-ai'
				).map((provider) => {
					console.log(apiKeys, apiKeys?.[provider.id])
					return <SingleProviderAccordion
						provider={provider}
						storedData={apiKeys?.[provider.id]}
					/>
})}
			</div>
		</OptionsPageTab>
	);
}
