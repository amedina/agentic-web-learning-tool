// Optional PostCSS configuration for applications that need it
import tailwindcss from '@tailwindcss/postcss';

export const postcssConfig = {
	plugins: [tailwindcss()],
};
