/**
 * Internal dependencies
 */
import CircleEmpty from '../../circle/circleEmpty';

export interface MatrixComponentHorizontalProps {
  title: string;
  description: string;
  count: number;
  expand?: boolean;
  containerClasses?: string;
}

const MatrixComponentHorizontal = ({
  title,
  description,
  count,
  expand = false,
  containerClasses,
}: MatrixComponentHorizontalProps) => {
  return (
    <div className={containerClasses}>
      <div className="max-w-[672px]">
        <div className="flex justify-between items-center">
          <div className="flex gap-4 items-center">
            <CircleEmpty />
            <h4 className="text-xs font-medium dark:text-bright-gray">
              {title}
            </h4>
          </div>
          <div className="flex gap-4 items-center">
            <div className="w-[100px] h-1 bg-light-gray dark:bg-cultured" />
            <div className="text-xs font-semibold dark:text-bright-gray min-w-[24px] text-right">
              {count}
            </div>
          </div>
        </div>
        {description && expand && (
          <div className="mt-2 ml-6 pl-px lg:max-w-[45%] max-w-[60%]">
            <p className="text-xs mt-1.5 text-darkest-gray dark:text-manatee">
              {description}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MatrixComponentHorizontal;
