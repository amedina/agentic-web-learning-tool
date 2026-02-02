/**
 * External dependencies
 */
import { TabsContent, Button } from "@google-awlt/design-system";

const PingTab = ({ onPingClick }: { onPingClick: () => void }) => {
  return (
    <TabsContent value="ping">
      <div className="flex">
        <Button onClick={onPingClick} size="lg" className="px-3 rounded-md">
          Ping Server
        </Button>
      </div>
    </TabsContent>
  );
};

export default PingTab;
