/**
 * External dependencies
 */
import { OptionsPageTab } from "@google-awlt/design-system";

/**
 * Internal dependencies
 */
import { INITIAL_PROVIDERS } from "../../../../constants";
import SingleProviderAccordion from "./singleProviderAccordion";
import { useModelProvider } from "../../providers";

export default function ModelsTab() {
  const { apiKeys } = useModelProvider(({ state }) => ({
    apiKeys: state.apiKeys,
  }));

  return (
    <OptionsPageTab
      title="Models"
      description="Manage your AI provider API keys to power the Ask AI chatbox."
    >
      <div className="w-full flex flex-col flex-1">
        {INITIAL_PROVIDERS.map((provider) => (
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
