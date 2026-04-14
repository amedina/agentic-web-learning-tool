/**
 * External dependencies.
 */
import { useSidebar } from '@google-awlt/design-system';

/**
 * Internal dependencies.
 */
import { Tools } from '../panels/tools';
import { Inspector } from '../panels/inspector';

const Main = () => {
  const { actions, state } = useSidebar();
  const { selectedMenuItem = 'tools' } = state;

  const renderContent = () => {
    switch (selectedMenuItem) {
      case 'tools':
        return <Tools setSelectedMenuItem={actions.setSelectedMenuItem} />;
      case 'inspector':
        return <Inspector />;
      default:
        return <Tools setSelectedMenuItem={actions.setSelectedMenuItem} />;
    }
  };

  return (
    <main className="flex-1 h-full overflow-hidden">{renderContent()}</main>
  );
};

export default Main;
