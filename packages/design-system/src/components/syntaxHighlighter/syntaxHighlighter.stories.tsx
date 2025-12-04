/**
 * External dependencies
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
/**
 * Internal dependencies
 */
import SyntaxHighlighter from './syntaxHighlighter';

const meta: Meta<typeof SyntaxHighlighter> = {
	title: 'ui/SyntaxHighlighter',
	component: SyntaxHighlighter,
	tags: ['autodocs'],
	argTypes: {
		language: {
			control: 'select',
			options: ['tsx', 'python', 'js', 'ts', 'jsx'],
			description: 'The programming language used for highlighting.',
		},
		code: {
			control: 'text',
			description: 'The code content to be highlighted.',
		},
	},
};

export default meta;

type Story = StoryObj<typeof SyntaxHighlighter>;

/**
 * Example demonstrating highlighting for TypeScript/React (TSX).
 */
export const TypeScriptReact: Story = {
	args: {
		components: {
			Pre: (props) => (
				<pre
					style={{ backgroundColor: '#f0f0f0', padding: '10px' }}
					{...props}
				/>
			),
			Code: (props) => (
				<code style={{ fontFamily: 'monospace' }} {...props} />
			),
		},
		language: 'tsx',
		code: `import React, { useState, useEffect } from "react";

const Counter: React.FC = () => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    // Update the document title using the browser API
    document.title = \`You clicked \${count} times\`;
  }, [count]);

  return (
    <div>
      <h1>Current Count: {count}</h1>
      <button onClick={() => setCount(count + 1)}>
        Click Me
      </button>
    </div>
  );
};

export default Counter;
`,
	},
};

/**
 * Example demonstrating highlighting for Python code.
 */
export const PythonScript: Story = {
	args: {
		components: {
			Pre: (props) => (
				<pre
					style={{ backgroundColor: '#f0f0f0', padding: '10px' }}
					{...props}
				/>
			),
			Code: (props) => (
				<code style={{ fontFamily: 'monospace' }} {...props} />
			),
		},
		language: 'python',
		code: `
def fibonacci(n):
    """Generate the nth Fibonacci number."""
    if n <= 0:
        return 0
    elif n == 1:
        return 1
    else:
        return fibonacci(n-1) + fibonacci(n-2)

numbers = [fibonacci(i) for i in range(10)]
print(f"First 10 Fibonacci numbers: {numbers}")

if __name__ == "__main__":
    print(f"The 8th number is: {fibonacci(8)}")
`,
	},
};

/**
 * Example using standard JavaScript (which uses the registered TSX grammar).
 */
export const PlainJavaScript: Story = {
	args: {
		components: {
			Pre: (props) => (
				<pre
					style={{ backgroundColor: '#f0f0f0', padding: '10px' }}
					{...props}
				/>
			),
			Code: (props) => (
				<code style={{ fontFamily: 'monospace' }} {...props} />
			),
		},
		language: 'js',
		code: `
// Example of a function in plain JavaScript (ES6+)
function calculateTotal(items) {
  let total = 0;
  for (const item of items) {
    if (item.price > 0) {
      total += item.price * item.quantity;
    }
  }
  return total;
}

const order = calculateTotal([{ price: 10, quantity: 2 }, { price: 5, quantity: 4 }]);
console.log('Order Total:', order);
`,
	},
};
