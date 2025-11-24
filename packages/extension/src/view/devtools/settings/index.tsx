import classNames from 'classnames';

/**
 * Internal dependencies
 */
import { InformationContainer, SettingsContainer } from './components';

const Settings = () => {
	return (
		<div
			data-testid="extension-settings-content"
			className="h-full w-full flex flex-col min-w-[40rem] overflow-auto"
		>
			<div
				className={`${!open && 'border-b border-hex-gray dark:border-quartz'}`}
			>
				<div
					className={`p-4 border-b border-hex-gray dark:border-quartz`}
				>
					<button
						data-testid="settings-collapse-button"
						className="flex gap-2 text-2xl font-bold items-baseline dark:text-bright-gray cursor-pointer"
					>
						<h1 className="text-left">Settings</h1>
					</button>
				</div>
				<div
					data-testid="settings-main-content"
					className={classNames({ hidden: !open })}
				>
					<div className="lg:max-w-[729px] mx-auto flex justify-center flex-col mt-2 pb-10 px-4 gap-y-4">
						<SettingsContainer />
						<InformationContainer />
					</div>
				</div>
			</div>
		</div>
	);
};

export default Settings;
