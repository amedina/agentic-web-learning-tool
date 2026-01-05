/**
 * External dependencies
 */
import { useEffect, useImperativeHandle, useState } from 'react';
import { Settings } from 'lucide-react';

/**
 * Internal dependencies
 */
import { MathSchema, type MathConfig } from './math';

interface ToolConfigProps {
	ref: React.Ref<{
		getConfig: (formData: FormData) => MathConfig | undefined;
	}>;
	config: MathConfig;
}

const ToolConfig = ({ ref, config }: ToolConfigProps) => {
	const [operation, setOperation] = useState(config.operation || 'add');

	useEffect(() => {
		setOperation(config.operation || 'add');
	}, [config]);

	useImperativeHandle(
		ref,
		() => ({
			getConfig: (formData: FormData) => {
				const title = (formData.get('title') as string) || '';
				const description =
					(formData.get('description') as string) || '';
				const op = formData.get('operation') as MathConfig['operation'];
				const operand = (formData.get('operand') as string) || '';

				const configResult: Partial<MathConfig> = {
					title,
					description,
					operation: op,
					operand,
				};

				const validation = MathSchema.safeParse(configResult);
				if (!validation.success) {
					console.error('Invalid configuration:', validation.error);
					return undefined;
				}

				return validation.data;
			},
		}),
		[]
	);

	const isBinary = [
		'add',
		'subtract',
		'multiply',
		'divide',
		'power',
		'root',
	].includes(operation);

	return (
		<div className="space-y-6">
			<div className="bg-slate-100 rounded-lg p-4">
				<h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
					<Settings size={16} className="text-indigo-600" />
					Math Configuration
				</h3>

				<div className="space-y-4">
					<div>
						<label
							htmlFor="math-operation"
							className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2"
						>
							Operation
						</label>
						<select
							id="math-operation"
							name="operation"
							value={operation}
							onChange={(e) =>
								setOperation(
									e.target.value as MathConfig['operation']
								)
							}
							className="w-full p-2 bg-white border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-indigo-500"
						>
							<optgroup label="Basic Arithmetic">
								<option value="add">Add (+)</option>
								<option value="subtract">Subtract (-)</option>
								<option value="multiply">Multiply (*)</option>
								<option value="divide">Divide (/)</option>
							</optgroup>
							<optgroup label="Advanced">
								<option value="power">Power (^)</option>
								<option value="root">Root (√)</option>
							</optgroup>
							<optgroup label="Formatting">
								<option value="round">Round</option>
								<option value="floor">Floor</option>
								<option value="ceil">Ceil</option>
								<option value="abs">Absolute</option>
							</optgroup>
						</select>
					</div>

					{isBinary && (
						<div className="p-3 bg-white border border-slate-200 rounded-md">
							<label
								htmlFor="math-operand"
								className="block text-xs font-medium text-slate-700 mb-1"
							>
								{operation === 'root'
									? 'Base (default 2)'
									: 'Operand (Value to use with input)'}
							</label>
							<input
								id="math-operand"
								name="operand"
								type="number"
								step="any"
								defaultValue={config.operand}
								placeholder="0"
								className="w-full p-2 border border-slate-200 rounded text-sm font-mono"
							/>
							<p className="text-[10px] text-slate-400 mt-1">
								The Input will be used as the first number.
							</p>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default ToolConfig;
