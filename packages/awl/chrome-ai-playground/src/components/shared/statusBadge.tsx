interface StatusBadgeProps {
  status: string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  if (status === "readily" || status === "available") {
    return (
      <span className="text-xs bg-green-500/10 text-green-600 px-2 py-0.5 rounded-full font-medium">
        Ready
      </span>
    );
  }
  if (
    status === "after-download" ||
    status === "downloadable" ||
    status === "Download Req."
  ) {
    return (
      <span className="text-xs bg-yellow-500/10 text-yellow-600 px-2 py-0.5 rounded-full font-medium">
        Download Required
      </span>
    );
  }
  if (status === "downloading") {
    return (
      <span className="text-xs bg-blue-500/10 text-blue-600 px-2 py-0.5 rounded-full font-medium">
        Downloading...
      </span>
    );
  }
  if (status === "unchecked") {
    return (
      <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-medium">
        Unknown
      </span>
    );
  }
  return (
    <span className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded-full font-medium">
      Unavailable
    </span>
  );
}
