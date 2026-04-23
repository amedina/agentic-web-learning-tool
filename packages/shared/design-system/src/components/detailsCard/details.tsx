/**
 * External dependencies
 */
import { useMemo, useState, type ReactNode } from 'react';
import clsx from 'clsx';

export interface DetailsSection {
  label: string;
  content: string;
  isHtml?: boolean;
}

export interface DetailsRow {
  icon?: ReactNode;
  text: string;
}

export interface DetailsProps {
  sections?: DetailsSection[];
  rows?: DetailsRow[];
  valueLabel?: string;
  value?: string;
  showUrlDecodeToggle?: boolean;
  urlDecodeLabel?: string;
  descriptionLabel?: string;
  description?: string;
}

const Details = ({
  sections = [],
  rows = [],
  valueLabel,
  value,
  showUrlDecodeToggle = false,
  urlDecodeLabel = 'URL Decoded',
  descriptionLabel,
  description,
}: DetailsProps) => {
  const [showUrlDecoded, setShowUrlDecoded] = useState(false);

  const canBeDecoded = useMemo(() => {
    if (!value) {
      return false;
    }
    try {
      decodeURIComponent(value);
      return true;
    } catch {
      return false;
    }
  }, [value]);

  return (
    <div className="text-xs py-1 px-1.5">
      {sections.map(({ label, content, isHtml }, idx) => (
        <div key={idx} className="mb-4">
          <p className="font-bold text-raisin-black dark:text-bright-gray mb-1">
            {label}
          </p>
          {isHtml ? (
            <p
              className="text-outer-space-crayola dark:text-bright-gray"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          ) : (
            <p className="text-outer-space-crayola dark:text-bright-gray">
              {content}
            </p>
          )}
        </div>
      ))}

      {rows.map(({ icon, text }, idx) => (
        <div key={idx} className="flex gap-1 items-center mb-4">
          {icon}
          <p className="text-outer-space-crayola dark:text-bright-gray">
            {text}
          </p>
        </div>
      ))}

      {value !== undefined && (
        <>
          <p className="font-bold text-raisin-black dark:text-bright-gray mb-1 text-semibold flex items-center">
            {valueLabel && <span>{valueLabel}</span>}
            {showUrlDecodeToggle && (
              <label className="text-raisin-black dark:text-bright-gray text-xs font-normal flex items-center">
                <input
                  role="checkbox"
                  type="checkbox"
                  className={clsx(
                    'ml-3 mr-1 cursor-pointer dark:accent-orange-400 accent-royal-blue',
                    {
                      'dark:min-h-0 dark:min-w-0 dark:h-[13px] dark:w-[13px] dark:appearance-none dark:bg-outer-space dark:border dark:border-manatee dark:rounded-[3px]':
                        !showUrlDecoded,
                    }
                  )}
                  checked={showUrlDecoded}
                  onChange={() => setShowUrlDecoded(!showUrlDecoded)}
                />
                <span>{urlDecodeLabel}</span>
              </label>
            )}
          </p>
          <p className="mb-4 break-words text-outer-space-crayola dark:text-bright-gray">
            {showUrlDecoded && canBeDecoded ? decodeURIComponent(value) : value}
          </p>
        </>
      )}

      {descriptionLabel && (
        <p className="font-bold text-raisin-black dark:text-bright-gray mb-1">
          {descriptionLabel}
        </p>
      )}
      {description && (
        <p className="mb-4 text-outer-space-crayola dark:text-bright-gray">
          {description}
        </p>
      )}
    </div>
  );
};

export default Details;
