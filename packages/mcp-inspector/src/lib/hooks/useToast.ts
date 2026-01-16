import { toast as sonnerToast } from "@google-awlt/design-system";

export interface ToastProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  variant?: "default" | "destructive";
  action?: React.ReactNode;
}

function toast({ title, description, variant, ...props }: ToastProps) {
  if (variant === "destructive") {
    return sonnerToast.error(title, {
      description,
      ...props,
    });
  }
  return sonnerToast.success(title, {
    description,
    ...props,
  });
}

function useToast() {
  return {
    toast,
    dismiss: (toastId?: string) => sonnerToast.dismiss(toastId),
  };
}

export { useToast, toast };
