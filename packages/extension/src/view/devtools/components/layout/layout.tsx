/**
 * External dependencies.
 */
import { SidebarProvider } from '@google-awlt/design-system';

/**
 * Internal dependencies.
 */
import { EventLogsProvider } from '../eventLogger';
import Sidebar from './sidebar';
import Main from './main';

export const Layout = () => {
  return (
    <EventLogsProvider>
      <SidebarProvider placement="devtools">
        <div className="flex w-full h-screen">
          <Sidebar />
          <Main />
        </div>
      </SidebarProvider>
    </EventLogsProvider>
  );
};
