/**
 * External dependencies.
 */
import { useSidebar } from '@google-awlt/design-system';

/**
 * Internal dependencies.
 */
import { WebMCPTools } from '../eventLogger/webMCPTools';
import { WebMCPInspector } from '../eventLogger/webMCPInspector';

const Main = () => {
  const { actions, state } = useSidebar();
  const { selectedMenuItem } = state || 'tools';

  const renderContent = () => {
    switch (selectedMenuItem) {
      case 'tools':
        return (
          <WebMCPTools setSelectedMenuItem={actions.setSelectedMenuItem} />
        );
      case 'inspector':
        return <WebMCPInspector />;
      default:
        return (
          <WebMCPTools setSelectedMenuItem={actions.setSelectedMenuItem} />
        );
    }
  };

  return (
    <main className="flex-1 h-full overflow-hidden">{renderContent()}</main>
  );
};

export default Main;
