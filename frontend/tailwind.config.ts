import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#16202a",
        marine: "#0f766e",
        signal: "#f59e0b"
      }
    }
  },
  plugins: []
} satisfies Config;
