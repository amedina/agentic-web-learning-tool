/**
 * External dependencies
 */
import { VictoryPie } from 'victory-pie';
/**
 * Internal dependencies
 */
import Tooltip from './tooltip';

const EmptyCirclePieChart = ({
  tooltipText = '',
  showTooltip = false,
}: {
  tooltipText?: string;
  showTooltip?: boolean;
}) => {
  return (
    <div className="w-full h-full relative">
      <VictoryPie
        padding={0}
        innerRadius={175}
        colorScale={['#E8EAED']}
        data={[{ x: '', y: 100 }]}
      />
      <p className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center opacity-40 text-2xl leading-4 dark:text-bright-gray">
        0
      </p>
      {tooltipText && showTooltip && <Tooltip tooltipText={tooltipText} />}
    </div>
  );
};

export default EmptyCirclePieChart;
