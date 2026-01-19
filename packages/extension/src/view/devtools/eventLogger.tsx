/**
 * External dependencies.
 */
import { useMcpClient } from '@mcp-b/mcp-react-hooks';

const EventLogger = () => {
  const { client, tools } = useMcpClient();

  console.log('tools', tools, client);

  return (
    <div>
      <h1>Event Logger</h1>
    </div>
  );
};

export default EventLogger;
