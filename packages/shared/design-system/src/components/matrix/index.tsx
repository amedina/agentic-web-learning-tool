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
          // When there's no onClick, render the cell as a static <div> so
          // its title and description text are user-selectable (browsers
          // disable text selection inside <button> by default and the
          // button would also intercept drag-to-select gestures).
          const isInteractive = !!dataComponent.onClick;
          const innerClassName = clsx('p-3.5 w-full box-border', {
            'hover:opacity-90 active:opacity-50 hover:scale-[0.98] hover:bg-[#f5f5f5] dark:hover:bg-[#1d1d1d] hover:shadow-[inset_0_0_10px_5px_rgba(238,238,238,0.5)] dark:hover:shadow-[inset_0_0_10px_5px_rgba(32,32,32,0.1)] rounded-md transition-all duration-75 ease-in-out cursor-pointer':
              isInteractive,
            'cursor-default select-text': !isInteractive,
          });
          const inner = (
            <MatrixComponent
              isExpanded={expand}
              {...dataComponent}
              countClassName={
                dataComponent.countClassName + ' text-xxl leading-none'
              }
            />
          );
          return (
            <div
              key={index}
              className={clsx('py-1 border-bright-gray dark:border-quartz', {
                'border-b': !isLastTwoItems,
              })}
            >
              {isInteractive ? (
                <button
                  onClick={() => dataComponent.onClick?.(dataComponent.title)}
                  style={{ cursor: 'pointer' }}
                  className={innerClassName}
                >
                  {inner}
                </button>
              ) : (
                <div className={innerClassName}>{inner}</div>
              )}
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
