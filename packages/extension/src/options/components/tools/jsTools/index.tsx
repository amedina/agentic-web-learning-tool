import { DomInput, StaticInput } from './inputTools';
import { Condition } from './logicTools';
import { AlertNotification } from './outputTools';

const JSTools = () => {
	return (
		<>
			<div className="w-full">
				<h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
					Input Elements
				</h3>
				<DomInput />
				<StaticInput />
			</div>

			<div className="w-full">
				<h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
					Logic
				</h3>
				<Condition />
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
