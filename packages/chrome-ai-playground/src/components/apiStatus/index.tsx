/**
 * External dependencies
 */
import { OptionsPageTab } from "@google-awlt/design-system";

/**
 * Internal dependencies
 */
import BuiltInAPIs from "./sections/BuiltInAPIs";
import LocalAIEnvironment from "./sections/LocalAIEnvironment";

export default function APIStatusTab() {
  return (
    <OptionsPageTab
      title="API Status"
      description="A dashboard to verify the availability and health of Chrome's built-in AI capabilities and your local environment configuration."
    >
      <div className="flex flex-col gap-6">
        <BuiltInAPIs />
        <LocalAIEnvironment />
      </div>

      <div className="mt-8 pt-6 border-t border-border/50 text-xs text-muted-foreground">
        <h4 className="font-semibold mb-2">Current Limitations:</h4>
        <ul className="list-disc pl-4 space-y-1">
          <li>
            <strong>Chrome Flags:</strong> Extensions cannot directly read
            Chrome flag statuses. Instead, we infer their status by verifying
            the availability of the associated APIs.
          </li>
          <li>
            <strong>Model Download:</strong> Models are downloaded on-demand.
            Checks determine if a model is ready to use or requires downloading.
          </li>
        </ul>
      </div>
    </OptionsPageTab>
  );
}
