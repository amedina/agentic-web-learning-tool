/*
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * External dependencies.
 */
import { useEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import { ArrowUp, Copy, CopyCheck, Info } from 'lucide-react';
/**
 * Internal dependencies
 */

const InformationContainer = () => {
	const [copying, setCopying] = useState(false);
	const timeOutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const [open, setOpen] = useState(true);

	useEffect(() => {
		if (copying) {
			timeOutRef.current = setTimeout(() => {
				setCopying(false);
			}, 500);
		} else {
			if (timeOutRef.current) {
				clearTimeout(timeOutRef.current);
			}
		}
	}, [copying]);

	const sysInfo = [
		{
			label: 'Open Tabs',
			value: 1,
		},
		{
			label: 'Chrome Version',
			value: '113.0.5672.127',
		},
		{
			label: 'Awlt Version',
			value: '0.1.0',
		},
		{
			label: 'System Architecture',
			value: 'x64',
		},
	];

	return (
		<div data-testid="debugging-information">
			<div>
				<button
					className="w-full flex gap-2 justify-between text-2xl font-bold items-baseline dark:text-bright-gray cursor-pointer"
					onClick={() => setOpen((prevOpen) => !prevOpen)}
				>
					<div className="flex items-center flex-row mb-2 gap-x-2">
						<Info className="dark:text-bright-gray" />
						<span className="text-base font-bold dark:text-bright-gray">
							System Information
						</span>
					</div>
					<ArrowUp
						className={classNames(
							'mr-4',
							open && 'rotate-180 -translate-y-1'
						)}
					/>
				</button>
				<div
					className={classNames(
						{ hidden: !open },
						'relative rounded flex flex-col w-full px-4 py-4 border border-american-silver dark:border-quartz gap-y-3'
					)}
				>
					<div className="flex flex-row gap-x-2 justify-between items-start">
						{sysInfo.map((info) => (
							<div className="flex flex-col" key={info.label}>
								<span className="text-sm dark:text-bright-gray">
									{info.label}
								</span>
								<span className="text-xs text-darkest-gray dark:text-bright-gray">
									{info.value}
								</span>
							</div>
						))}
						<button
							data-testid="copy-button"
							disabled={copying}
							className="-ml-8 -mt-1"
						>
							{copying ? (
								<CopyCheck className="active:text-mischka dark:text-bright-gray dark:active:text-mischka" />
							) : (
								<Copy className="active:text-mischka dark:text-bright-gray dark:active:text-mischka" />
							)}
						</button>
					</div>
					<div className="flex flex-row">
						<div className="mt-1">
							<span className="text-sm dark:text-bright-gray">
								Installed Extensions:
							</span>
							<ul className="list-disc ml-4 mt-1">
								{[
									{
										extensionName: 'Extension 1',
										extensionId:
											'abcdefghijklmnoabcdefhijklmnoab',
									},
									{
										extensionName: 'Extension 2',
										extensionId:
											'mnopqrstuvwxyzabcdefhijklmnoabcd',
									},
									{
										extensionName: 'Awlt',
										extensionId:
											'awltawltawltawltawltawltawltawlt',
									},
								]?.map((extension, index) => {
									return (
										<li
											className="text-xs text-darkest-gray dark:text-bright-gray mt-1"
											key={index}
										>
											{extension.extensionName}:{' '}
											{extension.extensionId}
										</li>
									);
								})}
							</ul>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default InformationContainer;
