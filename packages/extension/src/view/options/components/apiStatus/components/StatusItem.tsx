
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
      <span className="text-sm font-medium shrink-0 mr-4">{label}</span>
      <div className="flex items-center justify-end gap-4 flex-1 min-w-0">
        {action && <div className="shrink-0">{action}</div>}
        {children && <div className="text-sm text-muted-foreground flex justify-end">{children}</div>}
      </div>
    </div>
  );
}
