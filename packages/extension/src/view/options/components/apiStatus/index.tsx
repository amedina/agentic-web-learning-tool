
/**
 * External dependencies
 */
import { OptionsPageTab } from '@google-awlt/design-system';
import LocalAIEnvironment from './sections/LocalAIEnvironment';
import BuiltInAPIs from './sections/BuiltInAPIs';
import ExtensionCoreHealth from './sections/ExtensionCoreHealth';

export default function APIStatusTab() {
  return (
    <OptionsPageTab
      title="API Status"
      description="Centralized health center ensuring both the Extension's core services and the Local AI environment are operational."
    >
      <div className="flex flex-col gap-6">
         <BuiltInAPIs />
         <LocalAIEnvironment />
         <ExtensionCoreHealth />
      </div>

      <div className="mt-8 pt-6 border-t border-border/50 text-xs text-muted-foreground">
        <h4 className="font-semibold mb-2">Note on Mocked Data & Limitations:</h4>
        <ul className="list-disc pl-4 space-y-1">
            <li><strong>Chrome Flags:</strong> Extensions cannot directly read flag status. We verify the availability of the resulting APIs.</li>
            <li><strong>Component Download Progress:</strong> Detailed download percentage is not exposed by the `window.ai` API, only general status ('after-download').</li>
        </ul>
      </div>
    </OptionsPageTab>
  );
}
