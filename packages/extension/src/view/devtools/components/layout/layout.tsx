/**
 * External dependencies.
 */
import { SidebarProvider } from '@google-awlt/design-system';

/**
 * Internal dependencies.
 */
import Sidebar from './sidebar';
import Main from './main';

export const Layout = () => {
  return (
    <SidebarProvider placement="devtools">
      <div className="flex w-full h-screen">
        <Sidebar />
        <Main />
      </div>
    </SidebarProvider>
  );
};
