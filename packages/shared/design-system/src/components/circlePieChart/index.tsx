/**
 * External dependencies
 */
import { useState } from 'react';
import { VictoryPie } from 'victory-pie';
import clsx from 'clsx';
/**
 * Internal dependencies
 */
import EmptyCirclePieChart from './emptyCirclePieChart';
import Tooltip from './tooltip';

interface CirclePieChartProps {
  centerCount: number;
  data: { count: number; color: string }[];
  title?: string;
  fallbackText?: string;
  infoIconClassName?: string;
  centerTitleExtraClasses?: string;
  bottomTitleExtraClasses?: string;
  pieChartExtraClasses?: string;
  tooltipText?: string;
}

export const MAX_COUNT = 999;

const CirclePieChart = ({
  centerCount,
  data,
  title,
  centerTitleExtraClasses = '',
  bottomTitleExtraClasses = '',
  pieChartExtraClasses = '',
  tooltipText = '',
}: CirclePieChartProps) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const centerTitleClasses = centerCount <= MAX_COUNT ? 'text-2xl' : 'text-l';

  return (
    <div
      className="w-full h-full flex flex-col items-center justify-start"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className="inline-block align-bottom w-16 relative">
        {centerCount <= 0 ? (
          <EmptyCirclePieChart
            tooltipText={tooltipText}
            showTooltip={showTooltip}
          />
        ) : (
          <div className={`w-full h-full relative ${pieChartExtraClasses}`}>
            <VictoryPie
              padding={0}
              innerRadius={175}
              data={data.map(({ count }) => ({ x: '', y: count }))}
              labels={() => ''}
              colorScale={data.map(({ color }) => color)}
            />
            <p
              className={clsx(
                'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-regular dark:text-bright-gray',
                centerTitleClasses,
                centerTitleExtraClasses
              )}
            >
              {centerCount <= MAX_COUNT ? centerCount : MAX_COUNT + '+'}
            </p>
            {tooltipText && showTooltip && (
              <Tooltip tooltipText={tooltipText} />
            )}
          </div>
        )}
      </div>
      {title && (
        <div
          className={`flex items-center justify-center gap-1 mt-2 relative ${bottomTitleExtraClasses}`}
        >
          <p className="text-xs text-center font-semibold leading-relaxed dark:text-bright-gray">
            {title}
          </p>
        </div>
      )}
    </div>
  );
};

export default CirclePieChart;
