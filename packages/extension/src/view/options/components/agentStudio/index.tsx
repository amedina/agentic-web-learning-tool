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
			title="Agents"
			description="Manage your LLM keys, configure provider settings, and fine-tune inference parameters."
		>
			<div className="w-full flex flex-col flex-1">
				{INITIAL_PROVIDERS.filter(
					(provider) => provider.id !== 'browser-ai'
				).map((provider) => (
					<SingleProviderAccordion
						key={provider.id}
						provider={provider}
						storedData={apiKeys?.[provider.id]}
						apiKeys={apiKeys}
					/>
				))}
			</div>
		</OptionsPageTab>
	);
}
