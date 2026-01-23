export interface TrayProps {
  selectedRow: any;
}

const Tray = ({ selectedRow }: TrayProps) => {
  return (
    <div className="border border-gray-300 dark:border-quartz shadow-sm h-full min-w-[10rem] overflow-y-auto">
      {selectedRow ? (
        <div>{JSON.stringify(selectedRow)}</div>
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
