import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        mac: {
          blue: "#0071e3",
          "blue-hover": "#0077ed",
          gray: {
            50: "#fbfbfd",
            100: "#f5f5f7",
            200: "#e5e5ea",
            300: "#d1d1d6",
            400: "#c7c7cc",
            500: "#aeaeb2",
            600: "#8e8e93",
            700: "#636366",
            800: "#3a3a3c",
            900: "#1c1c1e",
            950: "#121214",
          },
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"SF Pro Text"',
          '"SF Pro Display"',
          '"Segoe UI"',
          "Roboto",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
      },
      boxShadow: {
        mac: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
        "mac-lg": "0 10px 30px -5px rgba(0, 0, 0, 0.12), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        "mac-drawer": "-10px 0 30px -5px rgba(0, 0, 0, 0.15)",
        "mac-popover": "0 8px 24px -4px rgba(0,0,0,0.12), 0 2px 6px -1px rgba(0,0,0,0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
