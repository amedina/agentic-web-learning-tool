/**
 * External dependencies.
 */
import { useState } from 'react';
import { Resizable } from 're-resizable';
import classNames from 'clsx';

/**
 * Internal dependencies.
 */
import Sidebar from './sidebar';
import { EventLogger } from '../eventLogger';

export const Layout = () => {
  const [sidebarWidth, setSidebarWidth] = useState(150);
  const [allowTransition, setAllowTransition] = useState(true);
  const [isCollapsed] = useState(false);

  return (
    <div className="flex h-screen w-full">
      <Resizable
        size={{ width: sidebarWidth, height: '100%' }}
        defaultSize={{ width: `${sidebarWidth}px`, height: '100%' }}
        onResizeStart={() => {
          setAllowTransition(false);
        }}
        onResizeStop={(_, __, ___, d) => {
          setSidebarWidth((prevState) => prevState + d.width);
          setAllowTransition(true);
        }}
        minWidth={isCollapsed ? 40 : 160}
        maxWidth={'90%'}
        enable={{
          right: !isCollapsed,
        }}
        className={classNames('h-full', {
          'transition-all duration-300': allowTransition,
        })}
      >
        <Sidebar />
      </Resizable>
      <main className="w-full h-full">
        <EventLogger />
      </main>
    </div>
  );
};
