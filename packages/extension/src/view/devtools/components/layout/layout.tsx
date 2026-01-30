/**
 * External dependencies.
 */
import { SidebarProvider } from '@google-awlt/design-system';

/**
 * Internal dependencies.
 */
import { EventLogsProvider } from '../eventLogger/context';
import Sidebar from './sidebar';
import Main from './main';

export const Layout = () => {
  return (
    <SidebarProvider placement="devtools">
      <EventLogsProvider>
        <div className="flex w-full h-screen">
          <Sidebar />
          <Main />
        </div>
      </EventLogsProvider>
    </SidebarProvider>
  );
};
