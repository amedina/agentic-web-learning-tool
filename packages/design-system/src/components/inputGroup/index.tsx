/**
 * External dependencies
 */
import type { PropsWithChildren } from "react";

type InputGroupProps = PropsWithChildren & {
    label: string;
    help?: string;

}
const InputGroup = ({ label, children, help }: InputGroupProps) => (
  <div className="space-y-1.5">
    <label className="block text-[13px] font-medium text-amethyst-haze">
      {label}
    </label>
    {children}
    {help && <p className="text-[11px] text-exclusive-plum">{help}</p>}
  </div>
);

export default InputGroup;
