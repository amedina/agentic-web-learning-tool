/**
 * External dependencies
 */
import type { ToolCallMessagePartComponent } from '@assistant-ui/react';
import { Check, ChevronDownIcon, ChevronUpIcon, Loader2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
/**
 * Internal dependencies
 */
import { getToolNameWithoutPrefix, isJson } from '../../lib';
import { Button } from '../button';

export const ToolFallback: ToolCallMessagePartComponent = ({
  toolName,
  argsText,
  result,
  status,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [timing, setTiming] = useState('');
  const timingRef = useRef(Date.now());
  // Status config map for easy styling
  const statusConfig = {
    running: {
      badge: 'bg-stone-100 text-amethyst-haze',
      border: 'border-ring',
      icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
      text: 'Processing...',
    },
    complete: {
      badge: 'bg-teal-50 text-teal-700',
      border: 'border-ring',
      icon: <Check className="h-3.5 w-3.5" />,
      text: 'Executed',
    },
    incomplete: {
      badge: 'bg-red-50 text-red-700',
      border: 'border-red-100',
      icon: <div className="h-1.5 w-1.5 rounded-full bg-red-500" />,
      text: 'Failed',
    },
    'requires-action': {
      badge: 'bg-red-50 text-red-700',
      border: 'border-red-100',
      icon: <div className="h-1.5 w-1.5 rounded-full bg-red-500" />,
      //@ts-expect-error -- Some status have reason as well.
      text: status?.reason,
    },
  };

  useEffect(() => {
    if (status.type !== 'running') {
      setTiming(`${(Date.now() - timingRef.current) / 1000}s`);
    }
  }, [status.type]);

  const currentStatus =
    statusConfig?.[status.type as keyof typeof statusConfig];

  const resultToShow = useMemo(() => {
    if (typeof result === 'string') {
      if (isJson(result)) {
        return JSON.stringify(JSON.parse(result), null, 2);
      } else {
        return result;
      }
    }
    return JSON.stringify(result, null, 2);
  }, [result]);

  const argsToDisplay = useMemo(() => {
    if (typeof argsText === 'string') {
      if (isJson(argsText)) {
        return JSON.stringify(JSON.parse(argsText), null, 2);
      } else {
        return argsText;
      }
    }
    return JSON.stringify(argsText, null, 2);
  }, [argsText]);

  return (
    <div className="aui-tool-fallback-root mb-4 flex w-full flex-col gap-3 rounded-lg border py-3">
      <div className="aui-tool-fallback-header flex items-center gap-2 px-4">
        <div className="flex flex-grow items-center gap-2">
          {currentStatus?.icon}
          <span className="aui-tool-fallback-title">
            <b>{getToolNameWithoutPrefix(toolName)}</b>
          </span>
          {status.type !== 'running' && (
            <span className="aui-tool-fallback-title text-[12px]">
              {timing}
            </span>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)}>
          {!isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
        </Button>
      </div>
      {isOpen && (
        <div className="aui-tool-fallback-content flex flex-col gap-2 border-t pt-2">
          <div className="aui-tool-fallback-args-root px-4">
            <p className="aui-tool-fallback-args-header font-semibold">
              Arguments:
            </p>
            <pre className="aui-tool-fallback-args-value whitespace-pre-wrap dark:bg-[#1E1E1E] bg-[#F4F4F4] overflow-auto p-2 wrap-break-word">
              {argsToDisplay}
            </pre>
          </div>
          {result !== undefined && (
            <div className="aui-tool-fallback-result-root border-t border-solid px-4 pt-2">
              <p className="aui-tool-fallback-result-header font-semibold">
                Result:
              </p>
              <pre className="aui-tool-fallback-result-content whitespace-pre-wrap dark:bg-[#1E1E1E] bg-[#F4F4F4] overflow-auto p-2 wrap-break-word">
                {resultToShow}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
