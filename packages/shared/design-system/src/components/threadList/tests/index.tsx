/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import type * as React from 'react';
import '@testing-library/jest-dom';

/**
 * Mock @assistant-ui/react primitives so we can render ThreadList without a
 * real runtime. Each primitive is reduced to a plain wrapper that preserves
 * children and `asChild` semantics, which is enough to verify the static
 * structure of the panel.
 *
 * `globalThis.React` is wired up by `tests/jest.setup.cjs`, which lets the
 * factory build JSX without a top-level import (jest hoists `jest.mock` calls
 * above imports, so outer-scope bindings are unavailable here).
 */
jest.mock('@assistant-ui/react', () => {
  const ReactGlobal = (globalThis as unknown as { React: typeof React }).React;

  const passthrough =
    (testId: string) =>
    ({
      asChild,
      children,
      ...rest
    }: {
      asChild?: boolean;
      children?: React.ReactNode;
    } & Record<string, unknown>) => {
      if (asChild) {
        return ReactGlobal.isValidElement(children)
          ? ReactGlobal.cloneElement(children, rest)
          : children;
      }
      return ReactGlobal.createElement(
        'div',
        { 'data-testid': testId, ...rest },
        children
      );
    };

  return {
    ThreadListPrimitive: {
      Root: passthrough('aui-root'),
      New: passthrough('aui-new'),
      Items: ({
        components,
      }: {
        components?: { ThreadListItem?: React.ComponentType };
      }) => {
        const Item = components?.ThreadListItem;
        if (!Item) {
          return null;
        }
        return ReactGlobal.createElement(ReactGlobal.Fragment, null, [
          ReactGlobal.createElement(Item, { key: 'a' }),
          ReactGlobal.createElement(Item, { key: 'b' }),
        ]);
      },
    },
    ThreadListItemPrimitive: {
      Root: passthrough('aui-item-root'),
      Trigger: ({
        children,
        ...rest
      }: { children?: React.ReactNode } & Record<string, unknown>) =>
        ReactGlobal.createElement(
          'button',
          { type: 'button', ...rest },
          children
        ),
      Title: ({ fallback }: { fallback?: string }) =>
        ReactGlobal.createElement('span', null, fallback),
      Archive: passthrough('aui-item-archive'),
    },
  };
});

/**
 * The sidebar context is provided by `SidebarProvider` at the app level. In
 * unit tests we replace the hook with a no-op and render `SidebarTrigger` as
 * a plain button so the component tree can mount in isolation.
 */
jest.mock('../../sidebar', () => {
  const ReactGlobal = (globalThis as unknown as { React: typeof React }).React;
  return {
    useSidebar: () => ({ setOpen: jest.fn() }),
    SidebarTrigger: ({
      children,
      ...rest
    }: { children?: React.ReactNode } & Record<string, unknown>) =>
      ReactGlobal.createElement(
        'button',
        { type: 'button', 'data-testid': 'sidebar-trigger', ...rest },
        children
      ),
  };
});

import { ThreadList } from '../index';

describe('ThreadList', () => {
  it('renders the section header and collapse trigger', () => {
    render(<ThreadList isThreadLoading={false} />);
    expect(screen.getByText('Chat History')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar-trigger')).toBeInTheDocument();
  });

  it('renders the "New Chat" button', () => {
    render(<ThreadList isThreadLoading={false} />);
    // The header button and each thread item's title both surface "New Chat",
    // so multiple matches are expected — assert at least one is present.
    const newChatButtons = screen.getAllByRole('button', { name: /new chat/i });
    expect(newChatButtons.length).toBeGreaterThanOrEqual(1);
  });

  it('shows skeleton rows while threads are loading', () => {
    render(<ThreadList isThreadLoading={true} />);
    const skeletons = screen.getAllByRole('status', {
      name: /loading threads/i,
    });
    expect(skeletons).toHaveLength(5);
  });

  it('renders thread items when not loading', () => {
    render(<ThreadList isThreadLoading={false} />);
    // The mocked Items renders two ThreadListItem instances, each falling
    // back to "New Chat" for its title. Combined with the dedicated New Chat
    // button at the top, three matches are expected in total.
    expect(screen.getAllByText('New Chat')).toHaveLength(3);
  });
});
