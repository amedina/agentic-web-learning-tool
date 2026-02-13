/**
 * External dependencies
 */
import { TabsContent, Button } from "@google-awlt/design-system";
/**
 * Internal dependencies
 */
import JsonView from "./JsonView";

const PingTab = ({
  onPingClick,
  result,
}: {
  onPingClick: () => void;
  result: any;
}) => {
  return (
    <TabsContent value="ping" className="flex flex-col gap-2">
      <div className="flex">
        <Button onClick={onPingClick} size="lg" className="px-3 rounded-md">
          Ping Server
        </Button>
      </div>
      {result?.result && (
        <>
          <h4 className="font-semibold mb-2">
            Tool Result:
            {result.isError ? (
              <span className="text-red-600 font-semibold">Error</span>
            ) : (
              <span className="text-green-600 font-semibold">Success</span>
            )}
          </h4>
          <JsonView data={result.result} isError={result.isError} />
        </>
      )}
    </TabsContent>
  );
};

export default PingTab;
