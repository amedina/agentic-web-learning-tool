import { useEffect, useRef, useState } from 'react';
import { Sidebar, useSidebar } from '@google-awlt/design-system';
import classNames from 'classnames';
import { Resizable } from 're-resizable';

const Layout = () => {
	const [sidebarWidth, setSidebarWidth] = useState(200);
	const mainRef = useRef<HTMLElement>(null);

	const { activePanel, selectedItemKey, isCollapsed } = useSidebar(
		({ state, actions }) => ({
			activePanel: state.activePanel,
			selectedItemKey: state.selectedItemKey,
			currentItemKey: state.currentItemKey,
			isSidebarFocused: state.isSidebarFocused,
			updateSelectedItemKey: actions.updateSelectedItemKey,
			isKeySelected: actions.isKeySelected,
			isCollapsed: state.isCollapsed,
			sidebarItems: state.sidebarItems,
		})
	);

	const { Element: PanelElement, props } = activePanel.panel;

	useEffect(() => {
		if (isCollapsed) {
			setSidebarWidth(40);
		} else {
			setSidebarWidth(200);
		}
	}, [isCollapsed]);

	useEffect(() => {
		mainRef.current?.scrollTo({
			top: 0,
			left: 0,
		});
	}, [PanelElement]);

	const [allowTransition, setAllowTransition] = useState(true);

	const layoutWidth = selectedItemKey?.startsWith('learning')
		? 'min-w-[400px]'
		: 'min-w-[50rem]';

	return (
		<div className="w-full h-full flex flex-row z-1">
			<Resizable
				size={{ width: sidebarWidth, height: '100%' }}
				defaultSize={{ width: '200px', height: '100%' }}
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
				<Sidebar visibleWidth={sidebarWidth} />
			</Resizable>
			<div className="flex-1 h-full overflow-hidden flex flex-col">
				<main
					ref={mainRef}
					className={classNames('w-full flex-1 relative', {
						'overflow-hidden':
							selectedItemKey === 'privacy-sandbox',
						'overflow-auto': selectedItemKey !== 'privacy-sandbox',
					})}
				>
					<div className="w-full h-full">
						<div className={layoutWidth + ' h-full z-1'}>
							{PanelElement && <PanelElement {...props} />}
						</div>
					</div>
				</main>
			</div>
		</div>
	);
};

export default Layout;
