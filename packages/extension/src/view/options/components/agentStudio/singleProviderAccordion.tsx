/**
 * External dependencies
 */
import { useState, useCallback, useEffect, useMemo } from 'react';
import { ShieldCheck } from 'lucide-react';
import {
	Accordion,
	Button,
	Input,
	InputGroup,
	toast,
	ToggleSwitch,
} from '@google-awlt/design-system';

/**
 * Internal dependencies
 */
import { INITIAL_PROVIDERS } from '../../../../constants';
import type { APIKeys } from '../../../../types';

type SingleProviderAccordion = {
	provider: (typeof INITIAL_PROVIDERS)[0];
	storedData: APIKeys;
	apiKeys: Record<string, APIKeys>;
};

export default function SingleProviderAccordion({
	provider,
	storedData,
	apiKeys,
}: SingleProviderAccordion) {
	const [apiKey, setAPIKey] = useState<string>('');
	const [thinkingMode, setThinkingMode] = useState<boolean>(false);
	const [inputType, setInputType] = useState<string>('password');
	const [status, setStatus] = useState<boolean>(true);
	const [hasSaved, setSavedStatus] = useState<boolean>(false);

	const handleSetModelProviderDetails = useCallback(
		(provider: string) => {
			setSavedStatus(true);
			chrome.storage.sync.set({
				apiKeys: {
					...apiKeys,
					[provider]: {
						apiKey,
						thinkingMode,
						status,
					},
				},
			});
			toast.success('Provider settings have been updated.');
		},
		[apiKey, thinkingMode, status, apiKeys]
	);

	useEffect(() => {
		if (storedData?.apiKey) {
			setAPIKey(storedData.apiKey);
			setThinkingMode(storedData.thinkingMode ?? false);
			setStatus(storedData.status);
			setSavedStatus(true);
		}
	}, [storedData]);

	const shouldSubmitButtonBeDisabled = useMemo(() => {
		if (!apiKey) {
			return true;
		}

		if (
			apiKey === storedData?.apiKey &&
			thinkingMode === storedData?.thinkingMode &&
			status === storedData?.status
		) {
			return true;
		}

		return false;
	}, [storedData, apiKey, thinkingMode, status]);

	return (
		<Accordion
			triggerText={`${provider.id}`}
			type="single"
			collapsible
			onValueChange={() => {
				if (!hasSaved) {
					setAPIKey('');
					setInputType('password');
					setThinkingMode(false);
					setSavedStatus(false);
				}
			}}
		>
			<div className="flex flex-col flex-1 gap-2">
				<div className="flex flex-row flex-1 items-end gap-2 justify-between">
					<InputGroup label="API Key" className="w-full">
						<div className="relative">
							<Input
								type={inputType}
								value={apiKey}
								onChange={(e) => setAPIKey(e.target.value)}
								className="bg-transparent border-darth-vader text-accent-foreground transition-all w-full pl-3 pr-9 py-2 rounded-md text-sm"
								placeholder="sk-..."
							/>
							<ShieldCheck className="absolute right-3 top-2.5 w-4 h-4 text-exclusive-plum" />
						</div>
					</InputGroup>
					<Button
						onClick={() =>
							setInputType((prev) => {
								return prev === 'password'
									? 'text'
									: 'password';
							})
						}
						disabled={!apiKey}
					>
						{inputType === 'password' ? 'Show' : 'Hide'}
					</Button>
				</div>
				<div className="flex flex-col gap-2 justify-between">
					<div className="flex items-center gap-5 justify-between">
						<div>
							<div className="text-[13px] font-medium text-accent-foreground">
								Thinking Mode
							</div>
							<div className="text-[11px] text-amethyst-haze">
								Internal thought process before output.
							</div>
						</div>
						<ToggleSwitch
							checked={thinkingMode}
							onCheckedChange={(v) => setThinkingMode(v)}
						/>
					</div>
					<div className="flex items-center gap-2 justify-between">
						<div>
							<div className="text-[13px] font-medium text-accent-foreground">
								{status === true
									? 'Disable Provider'
									: 'Enable Provider'}
							</div>
							<div className="text-[11px] text-amethyst-haze">
								Availability status of the provider.
							</div>
						</div>
						<ToggleSwitch
							checked={status}
							onCheckedChange={(v) => setStatus(v)}
						/>
					</div>
				</div>
				<div>
					<Button
						onClick={() =>
							handleSetModelProviderDetails(provider.id)
						}
						disabled={shouldSubmitButtonBeDisabled}
					>
						{storedData?.apiKey ? 'Update' : 'Set'}
					</Button>
				</div>
			</div>
		</Accordion>
	);
}
