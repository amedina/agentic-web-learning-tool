/**
 * External dependencies.
 */
import React from 'react';
/**
 * Internal dependencies.
 */
import { cn } from '../../lib';

function OptionsPageTab({
  title,
  description,
  className,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
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
      <div className="w-full font-sans antialiased flex justify-center">
        <main className={cn('py-10 space-y-12', className)}>{children}</main>
      </div>
    </div>
  );
}

export default OptionsPageTab;
