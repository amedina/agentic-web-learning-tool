
import { cn } from '@google-awlt/design-system';

interface StatusCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  headerAction?: React.ReactNode;
}

export default function StatusCard({ title, description, children, className, headerAction }: StatusCardProps) {
  return (
    <div className={cn("flex flex-col p-6 rounded-xl border bg-card text-card-foreground shadow-sm", className)}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-semibold leading-none tracking-tight mb-1.5">{title}</h3>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        {headerAction}
      </div>
      <div className="flex-1 space-y-4">
        {children}
      </div>
    </div>
  );
}
