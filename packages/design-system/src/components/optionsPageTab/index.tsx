/**
 * External dependencies.
 */
import React from 'react';

function OptionsPageTab({
	title,
	description,
	children,
}: {
	title: string;
	description: string;
	children: React.ReactNode;
}) {
	return (
		<div className="min-h-screen w-full bg-background p-6 md:p-10">
			<div className="max-w-6xl">
				<div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
					<div>
						<div className="flex items-center gap-3 mb-1">
							<h1 className="text-3xl font-semibold text-accent-foreground tracking-tight">
								{title}
							</h1>
						</div>
						<p className="text-sm text-accent-foreground leading-relaxed">
							{description}
						</p>
					</div>
				</div>
			</div>
			<div className="w-full font-sans antialiased">
				<main className="max-w-4xl py-10 space-y-12">{children}</main>
			</div>
		</div>
	);
}

export default OptionsPageTab;
