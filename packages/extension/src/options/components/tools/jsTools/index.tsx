import { DomInput } from './inputTools';
import { AlertNotification } from './outputTools';

const JSTools = () => {
	return (
		<>
			<div className="w-full">
				<h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
					Input Elements
				</h3>
				<DomInput />
			</div>

			<div className="w-full">
				<h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
					Logic
				</h3>
			</div>

			<div className="w-full">
				<h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
					Output
				</h3>
				<AlertNotification />
			</div>
		</>
	);
};

export default JSTools;
