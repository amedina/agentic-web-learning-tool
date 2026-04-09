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
  headerRight,
  wrapperClasses,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  headerRight?: React.ReactNode;
  className?: string;
  wrapperClasses?: string;
}) {
  return (
    <div className="min-h-screen w-full bg-background p-6 md:p-10 box-border overflow-auto">
      <div className={cn('max-w-6xl', wrapperClasses)}>
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
          {headerRight}
        </div>
      </div>
      <div className="w-full font-sans antialiased">
        <main className={cn('py-10 space-y-12', className)}>{children}</main>
      </div>
    </div>
  );
}

export default OptionsPageTab;
