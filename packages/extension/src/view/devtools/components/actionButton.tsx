// @ts-ignore
const ActionButton = ({ onRunTool, t }) => {
  return (
    <button
      className="p-1 hover:bg-gray-200 rounded text-green-600 transition-colors"
      onClick={(e) => {
        e.stopPropagation();
        onRunTool(t);
      }}
      title="Run Tool"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polygon points="5 3 19 12 5 21 5 3" />
      </svg>
    </button>
  );
};

export default ActionButton;
