
import { cn } from '@google-awlt/design-system';

interface StatusItemProps {
  label: string;
  children?: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}

export default function StatusItem({ label, children, className, action }: StatusItemProps) {
  return (
    <div className={cn("flex items-center justify-between py-2 border-b last:border-0 border-border/50", className)}>
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium">{label}</span>
        {children && <div className="text-sm text-muted-foreground">{children}</div>}
      </div>
      {action && <div className="shrink-0 ml-4">{action}</div>}
    </div>
  );
}
