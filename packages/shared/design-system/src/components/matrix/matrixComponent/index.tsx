/**
 * External dependencies
 */
import clsx from 'clsx';
/**
 * Internal dependencies
 */
import Circle from '../../circle';

export interface MatrixComponentProps {
  color: string;
  title: string;
  description?: string;
  onClick?: (title: string) => void;
  count: number;
  isExpanded?: boolean;
  countClassName: string;
  containerClasses?: string;
}

const MatrixComponent = ({
  color,
  title,
  description = '',
  count,
  isExpanded = false,
  countClassName,
}: MatrixComponentProps) => {
  return (
    <div>
      <div className="flex gap-x-4">
        <Circle color={color} />
        <div className="lg:max-w-[80%] lg:mr-8 text-left">
          <h4 className="-mt-[3px] mb-1.5 text-xs font-medium dark:text-bright-gray">
            {title}
          </h4>
          <p style={{ color }} className={clsx(countClassName)}>
            {count}
          </p>
          {description && isExpanded && (
            <p
              className="mt-2 text-xs text-darkest-gray dark:text-bright-gray"
              dangerouslySetInnerHTML={{ __html: description }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default MatrixComponent;
