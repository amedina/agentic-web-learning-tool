import { TableRow } from "../../useTable/types";

export interface TrayProps {
  selectedRow?: TableRow;
}

const Tray = ({ selectedRow }: TrayProps) => {
  return (
    <div className="border border-gray-300 dark:border-quartz shadow-sm h-full min-w-[10rem] overflow-y-auto">
      {selectedRow ? (
        <div className="p-4">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {selectedRow.originalData.description}
          </p>
        </div>
      ) : (
        <div className="h-full p-8 flex items-center">
          <p className="text-lg w-full font-bold text-granite-gray dark:text-manatee text-center">
            Select a row to view details
          </p>
        </div>
      )}
    </div>
  );
};

export default Tray;
