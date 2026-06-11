/**
 * External dependencies.
 */
import React from "react";
import { XCircle } from "lucide-react";

/**
 * Error Boundary.
 */
export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-6 w-[400px] h-[300px] bg-red-50 text-red-800 text-center overflow-auto antialiased">
          <XCircle size={40} className="text-red-500 mb-4" />
          <p className="font-semibold text-red-700 mb-2">Popup UI Crashed</p>
          <pre className="text-[10px] text-left w-full bg-red-100 p-2 rounded overflow-x-auto">
            {this.state.error?.message}
            {"\n"}
            {this.state.error?.stack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}
