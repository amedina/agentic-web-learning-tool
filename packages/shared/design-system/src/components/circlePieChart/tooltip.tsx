const Tooltip = ({ tooltipText }: { tooltipText?: string }) => {
  return (
    <div className="absolute left-1/2 bottom-0 translate-x-[-50%] translate-y-[110%] bg-black/80 text-white text-xs rounded px-2 py-1 shadow-lg animate-fadeIn z-10 pointer-events-none text-center max-w-xs min-w-[80px] w-max whitespace-pre-line transition-opacity duration-300">
      {tooltipText}
    </div>
  );
};

export default Tooltip;
