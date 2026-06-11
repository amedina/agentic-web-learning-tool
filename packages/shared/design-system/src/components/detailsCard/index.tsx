/**
 * External dependencies
 */
import { type ReactNode } from 'react';

export interface DetailsCardProps {
  emptyText?: string;
  hasContent?: boolean;
  children?: ReactNode;
}

const DetailsCard = ({
  emptyText = 'Select an item to view details',
  hasContent = false,
  children,
}: DetailsCardProps) => {
  return (
    <div
      data-testid="details-card"
      className="flex-1 border border-gray-300 dark:border-quartz shadow-sm h-full min-w-[10rem] overflow-y-auto"
    >
      {hasContent && children ? (
        children
      ) : (
        <div className="h-full p-8 flex items-center">
          <p className="text-lg w-full font-bold text-granite-gray dark:text-manatee text-center">
            {emptyText}
          </p>
        </div>
      )}
    </div>
  );
};

export default DetailsCard;
export {
  default as Details,
  type DetailsProps,
  type DetailsSection,
  type DetailsRow,
} from './details';
