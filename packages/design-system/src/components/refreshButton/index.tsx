import { RefreshCwIcon } from "lucide-react";

interface RefreshButtonProps {
  onClick?: () => void;
  title?: string;
}
const RefreshButton = ({ onClick, title = 'Refresh' }: RefreshButtonProps) => {
  return (
    <button
      onClick={onClick ? onClick : undefined}
      title={title}
      className={
        'flex items-center justify-center h-full text-center dark:text-mischka text-comet-black hover:text-comet-grey dark:hover:text-bright-gray dark:active:text-mischka active:text-comet-black pt-[1px]'
      }
    >
      <RefreshCwIcon className="h-[13px] w-[13px]" />
    </button>
  );
};

export default RefreshButton;
