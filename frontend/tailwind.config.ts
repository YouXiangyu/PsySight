import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // 模仿 ChatGPT 的一些常用色
        gpt: {
          sidebar: "#202123",
          main: "#343541",
          user: "#343541", // 或透明
          ai: "#444654",
          border: "#D9D9E3",
        }
      },
    },
  },
  plugins: [],
};
export default config;
