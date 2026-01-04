import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                obsidian: '#050505',
                zinc_dark: '#121212',
                amber_neon: '#FFB000',
                safety_gold: '#FFC033',
                zinc_text: '#E4E4E7',
            },
            fontFamily: {
                mono: ['var(--font-jetbrains-mono)', 'monospace'],
                sans: ['var(--font-inter)', 'sans-serif'],
            },
            boxShadow: {
                'bento-glow': '0 0 15px rgba(255, 176, 0, 0.1)',
                'bento-inner': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
            },
            backgroundImage: {
                "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
            },
            keyframes: {
                shimmer: {
                    "0%": { transform: "translateX(-150%) skewX(-12deg)" },
                    "100%": { transform: "translateX(150%) skewX(-12deg)" },
                },
                "accordion-down": {
                    from: { height: "0" },
                    to: { height: "var(--radix-accordion-content-height)" },
                },
                "accordion-up": {
                    from: { height: "var(--radix-accordion-content-height)" },
                    to: { height: "0" },
                },
            },
            animation: {
                "accordion-down": "accordion-down 0.2s ease-out",
                "accordion-up": "accordion-up 0.2s ease-out",
                shimmer: "shimmer 2.5s infinite linear",
            },
        },
    },
    plugins: [],
};
export default config;
