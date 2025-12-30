/**
 * External dependencies
 */
import { ComposerPrimitive } from "@assistant-ui/react";
import type { FC } from "react";

const EditComposer: FC = () => {
    return (
        <ComposerPrimitive.Root className="flex justify-end mb-8 w-full">
            <div className="w-full max-w-[85%] flex flex-col items-end gap-2 animate-in fade-in zoom-in-95 duration-200">
                <div className="w-full bg-muted border-2 border-indigo-500/20 ring-4 ring-indigo-500/5 rounded-[20px] rounded-tr-sm shadow-lg overflow-hidden transition-all">
                    <ComposerPrimitive.Input className="w-full bg-transparent px-5 py-4 text-[15px] leading-relaxed text-primary placeholder:exclusive-plum resize-none focus:outline-none min-h-[60px]" />
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pr-1">
                    <ComposerPrimitive.Cancel className="rounded-full bg-zinc-900 px-3 py-2 font-semibold text-sm text-white hover:bg-zinc-800">
                        Cancel
                    </ComposerPrimitive.Cancel>
                    <ComposerPrimitive.Send className="rounded-full bg-white px-3 py-2 font-semibold text-black text-sm hover:bg-white/90">
                        Send
                    </ComposerPrimitive.Send>
                </div>
            </div>
        </ComposerPrimitive.Root>
    );
};

export default EditComposer;
