import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
    "./src/app/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        void: "var(--bg-void)",
        canvas: "var(--surface-canvas)",
        card: "var(--surface-card)",
        elevated: "var(--surface-elevated)",
        subtle: "var(--surface-subtle)",
        "surface-card": "var(--surface-card)",
        "surface-canvas": "var(--surface-canvas)",
        "surface-elevated": "var(--surface-elevated)",
        "surface-subtle": "var(--surface-subtle)",
        "surface-active": "var(--surface-active)",
        "border-default": "var(--border-default)",
        "border-subtle": "var(--border-subtle)",
      },
      fontFamily: {
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "Liberation Mono",
          "Courier New",
          "monospace",
        ],
      },
    },
  },
  plugins: [],
} satisfies Config;
