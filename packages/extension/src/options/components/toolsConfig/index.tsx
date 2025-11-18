const ToolsConfig = () => {
	return (
		<div className="h-full min-w-1/7">
			<h2 className="text-xl font-bold mb-4">Configuration</h2>
			<form>
				<label className="block mb-2">
					<span className="text-gray-700">Node Title:</span>
				</label>
				<input
					type="text"
					className="w-full p-2 border border-gray-300 rounded"
					placeholder="Enter node title"
				/>
				<label className="block mb-2 mt-4">
					<span className="text-gray-700">Node Description:</span>
				</label>
				<textarea
					className="w-full p-2 border border-gray-300 rounded"
					placeholder="Enter node description"
				></textarea>
				<button
					type="submit"
					className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
				>
					Save Configuration
				</button>
			</form>
		</div>
	);
};

export default ToolsConfig;
