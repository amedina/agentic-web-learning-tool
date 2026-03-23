/**
 * External dependencies
 */
import {
  MarkdownTextPrimitive,
  unstable_memoizeMarkdownComponents as memoizeMarkdownComponents,
  useIsMarkdownCodeBlock,
} from "@assistant-ui/react-markdown";
import "@assistant-ui/react-markdown/styles/dot.css";
import { memo } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const MarkdownTextImpl = () => {
  return (
    <MarkdownTextPrimitive className="aui-md" components={defaultComponents} />
  );
};

const MarkdownText = memo(MarkdownTextImpl);

const defaultComponents = memoizeMarkdownComponents({
  h1: ({ className, children, ...props }) => (
    <h1
      className={cn(
        "aui-md-h1 mb-8 scroll-m-20 text-4xl font-extrabold tracking-tight last:mb-0",
        className,
      )}
      {...props}
    >
      {children}
    </h1>
  ),
  h2: ({ className, children, ...props }) => (
    <h2
      className={cn(
        "aui-md-h2 mt-8 mb-4 scroll-m-20 text-3xl font-semibold tracking-tight first:mt-0 last:mb-0",
        className,
      )}
      {...props}
    >
      {children}
    </h2>
  ),
  h3: ({ className, children, ...props }) => (
    <h3
      className={cn(
        "aui-md-h3 mt-6 mb-4 scroll-m-20 text-2xl font-semibold tracking-tight first:mt-0 last:mb-0",
        className,
      )}
      {...props}
    >
      {children}
    </h3>
  ),
  h4: ({ className, children, ...props }) => (
    <h4
      className={cn(
        "aui-md-h4 mt-6 mb-4 scroll-m-20 text-xl font-semibold tracking-tight first:mt-0 last:mb-0",
        className,
      )}
      {...props}
    >
      {children}
    </h4>
  ),
  h5: ({ className, children, ...props }) => (
    <h5
      className={cn(
        "aui-md-h5 my-4 text-lg font-semibold first:mt-0 last:mb-0",
        className,
      )}
      {...props}
    >
      {children}
    </h5>
  ),
  h6: ({ className, children, ...props }) => (
    <h6
      className={cn(
        "aui-md-h6 my-4 font-semibold first:mt-0 last:mb-0",
        className,
      )}
      {...props}
    >
      {children}
    </h6>
  ),
  p: ({ className, children, ...props }) => (
    <p
      className={cn("aui-md-p my-2 leading-7 first:mt-0 last:mb-0", className)}
      {...props}
    >
      {children}
    </p>
  ),
  a: ({ className, children, ...props }) => (
    <a
      className={cn(
        "aui-md-a font-medium text-primary underline underline-offset-4",
        className,
      )}
      {...props}
    >
      {children}
    </a>
  ),
  blockquote: ({ className, children, ...props }) => (
    <blockquote
      className={cn("aui-md-blockquote border-l-2 pl-6 italic", className)}
      {...props}
    >
      {children}
    </blockquote>
  ),
  ul: ({ className, children, ...props }) => (
    <ul
      className={cn("aui-md-ul my-5 ml-6 list-disc [&>li]:mt-2", className)}
      {...props}
    >
      {children}
    </ul>
  ),
  ol: ({ className, children, ...props }) => (
    <ol
      className={cn("aui-md-ol my-5 ml-6 list-decimal [&>li]:mt-2", className)}
      {...props}
    >
      {children}
    </ol>
  ),
  hr: ({ className, ...props }) => (
    <hr className={cn("aui-md-hr my-5 border-b", className)} {...props} />
  ),
  table: ({ className, children, ...props }) => (
    <table
      className={cn(
        "aui-md-table my-5 w-full border-separate border-spacing-0 overflow-y-auto",
        className,
      )}
      {...props}
    >
      {children}
    </table>
  ),
  th: ({ className, children, ...props }) => (
    <th
      className={cn(
        "aui-md-th bg-muted px-4 py-2 text-left font-bold text-xs first:rounded-tl-lg last:rounded-tr-lg [&[align=center]]:text-center [&[align=right]]:text-right",
        className,
      )}
      {...props}
    >
      {children}
    </th>
  ),
  td: ({ className, children, ...props }) => (
    <td
      className={cn(
        "aui-md-td border-b border-l px-4 py-2 text-left text-xs last:border-r [&[align=center]]:text-center [&[align=right]]:text-right",
        className,
      )}
      {...props}
    >
      {children}
    </td>
  ),
  tr: ({ className, children, ...props }) => (
    <tr
      className={cn(
        "aui-md-tr m-0 border-b p-0 first:border-t [&:last-child>td:first-child]:rounded-bl-lg [&:last-child>td:last-child]:rounded-br-lg",
        className,
      )}
      {...props}
    >
      {children}
    </tr>
  ),
  sup: ({ className, children, ...props }) => (
    <sup
      className={cn("aui-md-sup [&>a]:text-xs [&>a]:no-underline", className)}
      {...props}
    >
      {children}
    </sup>
  ),
  pre: ({ className, children, ...props }) => (
    <pre
      className={cn(
        "aui-md-pre overflow-x-auto !rounded-t-none rounded-b-lg bg-black p-4 text-white",
        className,
      )}
      {...props}
    >
      {children}
    </pre>
  ),
  code: function Code({ className, children, ...props }) {
    const isCodeBlock = useIsMarkdownCodeBlock();
    return (
      <code
        className={cn(
          !isCodeBlock &&
            "aui-md-inline-code font-semibold rounded text-amber-600",
          className,
        )}
        {...props}
      >
        {children}
      </code>
    );
  },
});

export default MarkdownText;
