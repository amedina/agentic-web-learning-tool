/**
 * External dependencies
 */
import type { ComponentProps } from "react";
import { Header, Trigger } from "@radix-ui/react-accordion";
import { ChevronDownIcon } from "lucide-react";
/**
 * Internal dependencies
 */
import { cn } from "../../lib";


function AccordionTrigger({
  className,
  children,
  ...props
}: ComponentProps<typeof Trigger>) {
  return (
    <Header className="flex">
      <Trigger
        data-slot="accordion-trigger"
        className={cn(
          "focus-visible:border-ring focus-visible:ring-ring/50 flex flex-1 items-start justify-between gap-4 rounded-md py-4 text-left text-sm font-medium transition-all outline-none [&[data-state=open]>svg]:rotate-180",
          className
        )}
        {...props}
      >
        {children}
        <ChevronDownIcon className="text-muted-foreground pointer-events-none size-4 shrink-0 translate-y-0.5 transition-transform duration-200" />
      </Trigger>
    </Header>
  )
}

export default AccordionTrigger;
