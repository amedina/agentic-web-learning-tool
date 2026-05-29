/**
 * External dependencies.
 */
import { Info } from "lucide-react";

interface NoticeStateProps {
  message: string;
}

/**
 * Informational takeover for benign "nothing to show" states like a package
 * URL that resolves to nothing on npm. Visually neutral so users don't read
 * it as a failure of the extension.
 */
export const NoticeState: React.FC<NoticeStateProps> = ({ message }) => (
  <div className="flex flex-col w-full h-full bg-slate-50 dark:bg-slate-900 antialiased">
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-slate-800 dark:text-slate-200 text-center">
      <Info size={40} className="text-blue-400 mb-4" />
      <p className="font-semibold text-slate-600 dark:text-slate-300">
        {message}
      </p>
    </div>
  </div>
);
