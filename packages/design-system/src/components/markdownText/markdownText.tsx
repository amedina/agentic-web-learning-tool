/**
 * External dependencies
 */

import {
	type CodeHeaderProps,
	MarkdownTextPrimitive,
	unstable_memoizeMarkdownComponents as memoizeMarkdownComponents,
	useIsMarkdownCodeBlock,
} from '@assistant-ui/react-markdown';
import remarkGfm from 'remark-gfm';
import { type FC, memo, useState } from 'react';
import { CheckIcon, CopyIcon } from 'lucide-react';
/**
 * Internal dependencies
 */
import { TooltipIconButton } from '../tooltipIconButton';
import { SyntaxHighlighter } from '../shikiHighlighter';
import { cn } from '../../lib/utils';

const MarkdownTextImpl = () => {
	return (
		<MarkdownTextPrimitive
			remarkPlugins={[remarkGfm]}
			className="aui-md"
			components={defaultComponents}
		/>
	);
};

const MarkdownText = memo(MarkdownTextImpl);

const CodeHeader: FC<CodeHeaderProps> = ({ language, code }) => {
	const { isCopied, copyToClipboard } = useCopyToClipboard();
	const onCopy = () => {
		if (!code || isCopied) return;
		copyToClipboard(code);
	};

	return (
		<div className="aui-code-header-root mt-4 flex items-center justify-between gap-4 rounded-t-lg bg-muted-foreground/15 px-4 py-2 text-sm font-semibold text-foreground dark:bg-muted-foreground/20">
			<span className="aui-code-header-language lowercase [&>span]:text-xs">
				{language}
			</span>
			<TooltipIconButton tooltip="Copy" onClick={onCopy}>
				{!isCopied && <CopyIcon />}
				{isCopied && <CheckIcon />}
			</TooltipIconButton>
		</div>
	);
};

const useCopyToClipboard = ({
	copiedDuration = 3000,
}: {
	copiedDuration?: number;
} = {}) => {
	const [isCopied, setIsCopied] = useState<boolean>(false);

	const copyToClipboard = (value: string) => {
		if (!value) return;

		navigator.clipboard.writeText(value).then(() => {
			setIsCopied(true);
			setTimeout(() => setIsCopied(false), copiedDuration);
		});
	};

	return { isCopied, copyToClipboard };
};

const defaultComponents = memoizeMarkdownComponents({
	SyntaxHighlighter,
	h1: ({ className, children, ...props }) => (
		<h1
			className={cn(
				'aui-md-h1 mb-8 scroll-m-20 text-4xl font-extrabold tracking-tight last:mb-0',
				className
			)}
			{...props}
		>
			{children}
		</h1>
	),
	h2: ({ className, children, ...props }) => (
		<h2
			className={cn(
				'aui-md-h2 mt-8 mb-4 scroll-m-20 text-3xl font-semibold tracking-tight first:mt-0 last:mb-0',
				className
			)}
			{...props}
		>
			{children}
		</h2>
	),
	h3: ({ className, children, ...props }) => (
		<h3
			className={cn(
				'aui-md-h3 mt-6 mb-4 scroll-m-20 text-2xl font-semibold tracking-tight first:mt-0 last:mb-0',
				className
			)}
			{...props}
		>
			{children}
		</h3>
	),
	h4: ({ className, children, ...props }) => (
		<h4
			className={cn(
				'aui-md-h4 mt-6 mb-4 scroll-m-20 text-xl font-semibold tracking-tight first:mt-0 last:mb-0',
				className
			)}
			{...props}
		>
			{children}
		</h4>
	),
	h5: ({ className, children, ...props }) => (
		<h5
			className={cn(
				'aui-md-h5 my-4 text-lg font-semibold first:mt-0 last:mb-0',
				className
			)}
			{...props}
		>
			{children}
		</h5>
	),
	h6: ({ className, children, ...props }) => (
		<h6
			className={cn(
				'aui-md-h6 my-4 font-semibold first:mt-0 last:mb-0',
				className
			)}
			{...props}
		>
			{children}
		</h6>
	),
	p: ({ className, children, ...props }) => (
		<p
			className={cn(
				'aui-md-p mt-5 mb-5 leading-7 first:mt-0 last:mb-0',
				className
			)}
			{...props}
		>
			{children}
		</p>
	),
	a: ({ className, children, ...props }) => (
		<a
			className={cn(
				'aui-md-a font-medium text-primary underline underline-offset-4',
				className
			)}
			{...props}
		>
			{children}
		</a>
	),
	blockquote: ({ className, children, ...props }) => (
		<blockquote
			className={cn(
				'aui-md-blockquote border-l-2 pl-6 italic',
				className
			)}
			{...props}
		>
			{children}
		</blockquote>
	),
	ul: ({ className, children, ...props }) => (
		<ul
			className={cn(
				'aui-md-ul my-5 ml-6 list-disc [&>li]:mt-2',
				className
			)}
			{...props}
		>
			{children}
		</ul>
	),
	ol: ({ className, children, ...props }) => (
		<ol
			className={cn(
				'aui-md-ol my-5 ml-6 list-decimal [&>li]:mt-2',
				className
			)}
			{...props}
		>
			{children}
		</ol>
	),
	hr: ({ className, ...props }) => (
		<hr className={cn('aui-md-hr my-5 border-b', className)} {...props} />
	),
	table: ({ className, children, ...props }) => (
		<table
			className={cn(
				'aui-md-table my-5 w-full border-separate border-spacing-0 overflow-y-auto',
				className
			)}
			{...props}
		>
			{children}
		</table>
	),
	th: ({ className, children, ...props }) => (
		<th
			className={cn(
				'aui-md-th bg-muted px-4 py-2 text-left font-bold first:rounded-tl-lg last:rounded-tr-lg [&[align=center]]:text-center [&[align=right]]:text-right',
				className
			)}
			{...props}
		>
			{children}
		</th>
	),
	td: ({ className, children, ...props }) => (
		<td
			className={cn(
				'aui-md-td border-b border-l px-4 py-2 text-left last:border-r [&[align=center]]:text-center [&[align=right]]:text-right',
				className
			)}
			{...props}
		>
			{children}
		</td>
	),
	tr: ({ className, children, ...props }) => (
		<tr
			className={cn(
				'aui-md-tr m-0 border-b p-0 first:border-t [&:last-child>td:first-child]:rounded-bl-lg [&:last-child>td:last-child]:rounded-br-lg',
				className
			)}
			{...props}
		>
			{children}
		</tr>
	),
	sup: ({ className, children, ...props }) => (
		<sup
			className={cn(
				'aui-md-sup [&>a]:text-xs [&>a]:no-underline',
				className
			)}
			{...props}
		>
			{children}
		</sup>
	),
	pre: ({ className, children, ...props }) => (
		<pre
			className={cn(
				'aui-md-pre overflow-x-auto !rounded-t-none rounded-b-lg bg-black p-4 text-white',
				className
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
						'aui-md-inline-code font-semibold rounded text-amber-600',
					className
				)}
				{...props}
			>
				{children}
			</code>
		);
	},
	CodeHeader,
});

export default MarkdownText;
