type ToggleSwitchProps = {
	enabled: boolean;
	setEnabled: (newValue: boolean) => void;
	onLabel?: string;
	additionalStyles?: string;
};

const ToggleSwitch = ({
	enabled,
	setEnabled,
	onLabel = '',
	additionalStyles = 'relative',
}: ToggleSwitchProps) => {
	return (
		<div
			className={`${additionalStyles} flex flex-col items-center justify-center overflow-hidden`}
		>
			<>
				<label className="autoSaverSwitch relative inline-flex cursor-pointer select-none items-center">
					<input
						data-testid="toggle-button-input"
						type="checkbox"
						name="autoSaver"
						className="sr-only"
						checked={enabled}
						onChange={() => setEnabled(!enabled)}
					/>
					<span
						data-testid="toggle-button"
						className={`slider mr-3 flex h-3 w-6 items-center rounded-full p-1 duration-200 ${
							enabled ? 'bg-toggle-on' : 'bg-quartz'
						}`}
					>
						<span
							className={`dot h-1.5 w-1.5 rounded-full bg-white duration-200 ${
								enabled ? 'translate-x-2.5' : ''
							}`}
						></span>
					</span>
					<span className="label flex items-center text-sm font-medium text-black">
						{onLabel}
					</span>
				</label>
			</>
		</div>
	);
};

export default ToggleSwitch;
