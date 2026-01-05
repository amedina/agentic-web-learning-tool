/**
 * External dependencies
 */
import { useImperativeHandle } from 'react';
import { Settings } from 'lucide-react';

/**
 * Internal dependencies
 */
import {
	AlertNotificationSchema,
	type AlertNotificationConfig,
} from './alertNotification';

interface ToolConfigProps {
	ref: React.Ref<{
		getConfig: (formData: FormData) => AlertNotificationConfig | undefined;
	}>;
	config: AlertNotificationConfig;
}

const ToolConfig = ({ ref, config }: ToolConfigProps) => {
	useImperativeHandle(
		ref,
		() => ({
			getConfig: (formData: FormData) => {
				const title = (formData.get('title') as string) || '';
				const useCustomMessage =
					formData.get('useCustomMessage') === 'on';
				const message = (formData.get('message') as string) || '';

				const configResult: AlertNotificationConfig = {
					title,
					useCustomMessage,
					message,
				};

				const validation =
					AlertNotificationSchema.safeParse(configResult);
				if (!validation.success) {
					console.error('Invalid configuration:', validation.error);
					return undefined;
				}

				return validation.data;
			},
		}),
		[]
	);

	return (
		<div className="space-y-4">
			<div className="p-4 bg-slate-100 rounded-lg space-y-4">
				<h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
					<Settings size={16} className="text-indigo-600" />
					Alert Configuration
				</h3>

				<div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-md">
					<div className="space-y-0.5">
						<label
							htmlFor="use-custom-message"
							className="text-xs font-medium text-slate-700 cursor-pointer"
						>
							Use Custom Output
						</label>
						<p className="text-[10px] text-slate-400">
							Show static text instead of dynamic input
						</p>
					</div>
					<input
						id="use-custom-message"
						name="useCustomMessage"
						type="checkbox"
						defaultChecked={config.useCustomMessage}
						className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded cursor-pointer"
					/>
				</div>

				<div className="bg-white border border-slate-200 rounded-md p-3 space-y-2">
					<label
						htmlFor="alert-message"
						className="block text-xs font-medium text-slate-700"
					>
						Custom Message
					</label>
					<textarea
						id="alert-message"
						name="message"
						defaultValue={config.message}
						placeholder="The output is..."
						rows={3}
						className="w-full p-2 border border-slate-200 rounded text-sm focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50 disabled:text-slate-400"
					/>
				</div>
			</div>
		</div>
	);
};

export default ToolConfig;
