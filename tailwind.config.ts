import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        ignis: {
          canvas: "#0C0F13",
          sidebar: "#15191F",
          card: "#1B2027",
          border: "#303741",
          amber: "#E99847",
          blue: "#78A9D8",
          green: "#5CB59B",
          red: "#D97777",
          muted: "#A1AAB5",
          dim: "#737F8C",
        },
      },
    },
  },
  plugins: [],
};
export default config;
