/**
 * External dependencies
 */
import { useEffect, useImperativeHandle, useState } from 'react';
import { Settings } from 'lucide-react';

/**
 * Internal dependencies
 */
import { TranslatorApiSchema, type TranslatorApiConfig } from './translatorApi';

import { getWorkflowClient } from '@google-awlt/engine-extension';

interface ToolConfigProps {
	ref: React.Ref<{
		getConfig: (formData: FormData) => TranslatorApiConfig | undefined;
	}>;
	config: TranslatorApiConfig;
}

const ToolConfig = ({ ref, config }: ToolConfigProps) => {
	const [sourceLanguage, setSourceLanguage] = useState(
		config.sourceLanguage || 'en'
	);
	const [targetLanguage, setTargetLanguage] = useState(
		config.targetLanguage || 'es'
	);
	const [isAvailable, setIsAvailable] = useState(true);
	const [isChecking, setIsChecking] = useState(false);

	useEffect(() => {
		const check = async () => {
			setIsChecking(true);
			try {
				const client = getWorkflowClient();
				const results = await client.checkCapabilities({
					translatorApi: {
						sourceLanguage,
						targetLanguage,
					},
				});

				setIsAvailable(!!results.translatorApi);
			} catch (error) {
				console.error(
					'Failed to check translator availability:',
					error
				);
				setIsAvailable(false);
			} finally {
				setIsChecking(false);
			}
		};

		check();
	}, [sourceLanguage, targetLanguage]);

	useEffect(() => {
		setSourceLanguage(config.sourceLanguage || 'en');
		setTargetLanguage(config.targetLanguage || 'es');
	}, [config]);

	useImperativeHandle(
		ref,
		() => ({
			getConfig: (formData: FormData) => {
				const title = formData.get('title') as string;
				const sourceLanguage = formData.get('sourceLanguage') as string;
				const targetLanguage = formData.get('targetLanguage') as string;

				const configResult = {
					title,
					sourceLanguage,
					targetLanguage,
				};

				const validation = TranslatorApiSchema.safeParse(configResult);
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
		<div className="space-y-6">
			<div className="bg-slate-100 dark:bg-slate-900/50 rounded-lg p-4 border border-transparent dark:border-slate-800">
				<h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
					<Settings
						size={16}
						className="text-indigo-600 dark:text-indigo-400"
					/>
					Translator API Configuration
				</h3>

				<div className="space-y-4">
					<div>
						<label
							className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
							htmlFor="sourceLanguage"
						>
							Source Language
						</label>
						<select
							name="sourceLanguage"
							id="sourceLanguage"
							value={sourceLanguage}
							className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
							onChange={(e) =>
								setSourceLanguage(
									e.target.value as 'en' | 'ja' | 'es'
								)
							}
						>
							<option value="en" className="dark:bg-slate-900">
								English
							</option>
							<option value="es" className="dark:bg-slate-900">
								Spanish
							</option>
							<option value="ja" className="dark:bg-slate-900">
								Japanese
							</option>
						</select>
					</div>

					<div>
						<label
							className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
							htmlFor="targetLanguage"
						>
							Target Language
						</label>
						<select
							name="targetLanguage"
							id="targetLanguage"
							value={targetLanguage}
							className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
							onChange={(e) =>
								setTargetLanguage(
									e.target.value as 'en' | 'ja' | 'es'
								)
							}
						>
							<option value="en" className="dark:bg-slate-900">
								English
							</option>
							<option value="es" className="dark:bg-slate-900">
								Spanish
							</option>
							<option value="ja" className="dark:bg-slate-900">
								Japanese
							</option>
						</select>
					</div>

					{!isAvailable && !isChecking && (
						<div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-md">
							<p className="text-xs text-red-600 dark:text-red-400 font-medium">
								Warning: This language pair is not available in
								your browser&apos;s Translator API.
							</p>
						</div>
					)}

					{isChecking && (
						<div className="p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-md animate-pulse">
							<p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
								Checking language pack availability...
							</p>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default ToolConfig;
