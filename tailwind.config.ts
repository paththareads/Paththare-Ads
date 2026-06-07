import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      keyframes: {
        shake: {
          "0%": { transform: "translateX(0)" },
          "20%": { transform: "translateX(4px)" },
          "10%": { transform: "translateX(-4px)" },
          "40%": { transform: "translateX(4px)" },
          "30%": { transform: "translateX(-4px)" },
          "60%": { transform: "translateX(4px)" },
          "70%": { transform: "translateX(-4px)" },
          "80%": { transform: "translateX(4px)" },
          "90%": { transform: "translateX(-4px)" },
          "100%": { transform: "translateX(0)" },
        },
      },
      animation: {
        shake: "shake 0.35s ease-in-out",
      },
    },
  },
  plugins: [],
};
export default config;
