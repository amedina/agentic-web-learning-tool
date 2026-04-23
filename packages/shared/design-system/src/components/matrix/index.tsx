/**
 * External dependencies
 */
import clsx from 'clsx';
/**
 * Internal dependencies
 */
import MatrixComponent, { type MatrixComponentProps } from './matrixComponent';

interface MatrixProps {
  dataComponents: MatrixComponentProps[];
  expand?: boolean;
  extraClasses?: string;
}

const Matrix = ({ dataComponents, expand, extraClasses }: MatrixProps) => {
  if (!dataComponents || !dataComponents.length) {
    return null;
  }

  return (
    <div
      className={`grid grid-cols-2 gap-x-5 ${extraClasses ?? ''}`}
      data-testid="matrix"
    >
      {dataComponents.map((dataComponent, index) => {
        if (dataComponent && dataComponent.countClassName) {
          const isLastTwoItems =
            index === dataComponents.length - 1 ||
            index === dataComponents.length - 2;
          return (
            <div
              key={index}
              className={clsx('py-1 border-bright-gray dark:border-quartz', {
                'border-b': !isLastTwoItems,
              })}
            >
              <button
                onClick={() => dataComponent.onClick?.(dataComponent.title)}
                style={{
                  cursor: !dataComponent.onClick ? 'default' : 'pointer',
                }}
                className={clsx('p-3.5 w-full box-border', {
                  'hover:opacity-90 active:opacity-50 hover:scale-[0.98] hover:bg-[#f5f5f5] dark:hover:bg-[#1d1d1d] hover:shadow-[inset_0_0_10px_5px_rgba(238,238,238,0.5)] dark:hover:shadow-[inset_0_0_10px_5px_rgba(32,32,32,0.1)] rounded-md transition-all duration-75 ease-in-out cursor-pointer':
                    dataComponent.onClick,
                  'cursor-default': !dataComponent.onClick,
                })}
              >
                <MatrixComponent
                  isExpanded={expand}
                  {...dataComponent}
                  countClassName={
                    dataComponent.countClassName + ' text-xxl leading-none'
                  }
                />
              </button>
            </div>
          );
        }
        return null;
      })}
    </div>
  );
};

export default Matrix;
export {
  default as MatrixComponent,
  type MatrixComponentProps,
} from './matrixComponent';
export {
  default as MatrixComponentHorizontal,
  type MatrixComponentHorizontalProps,
} from './matrixComponent/matrixComponentHorizontal';
