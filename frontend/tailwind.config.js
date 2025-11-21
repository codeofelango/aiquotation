/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
	theme: {
		extend: {
			colors: {
				brand: {
					DEFAULT: "#0284c7",
					light: "#0ea5e9",
					dark: "#0369a1",
					50: "#f0f9ff",
					100: "#e0f2fe",
					200: "#bae6fd",
					300: "#7dd3fc",
					400: "#38bdf8",
					500: "#0ea5e9",
					600: "#0284c7",
					700: "#0369a1",
					800: "#075985",
					900: "#0c4a6e"
				},
				teal: {
					DEFAULT: "#0891b2",
					50: "#f0fdfa",
					100: "#ccfbf1",
					200: "#99f6e4",
					300: "#5eead4",
					400: "#2dd4bf",
					500: "#14b8a6",
					600: "#0d9488",
					700: "#0f766e",
					800: "#115e59",
					900: "#134e4a"
				}
			},
			boxShadow: {
				sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
				DEFAULT: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
				md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
				lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)"
			}
		}
	},
	plugins: []
}

