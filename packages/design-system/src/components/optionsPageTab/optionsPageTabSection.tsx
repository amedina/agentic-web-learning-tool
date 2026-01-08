/**
 * External dependencies.
 */
import React from 'react';

function OptionsPageTabSection({
	title,
	children,
}: {
	title: string;
	children: React.ReactNode;
}) {
	return (
		<section className="space-y-6">
			<div className="flex items-center gap-3 border-b border-subtle-zinc pb-2">
				<h2 className="text-sm font-medium uppercase tracking-wider text-gray">
					{title}
				</h2>
			</div>
			{children}
		</section>
	);
}

export default OptionsPageTabSection;
