import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        atrium: {
          ink: "#05030B",
          deep: "#120721",
          teal: "#0E6B6F",
          mint: "#9DD9C8",
          gold: "#F2B84B",
          solar: "#F7D27A",
          paper: "#F8F3E7",
          cloud: "#D9E7E1",
          coral: "#D96F59",
        },
        ba: {
          midnight: "#05030B",
          navy: "#070B18",
          purple: "#13091F",
          lime: "#D7FF3F",
          cyan: "#20F0D0",
          magenta: "#FF4FD8",
          orange: "#FF8A3D",
          gold: "#F2B84B",
        },
      },
      boxShadow: {
        glass: "0 30px 90px rgba(0, 0, 0, 0.36)",
        glow: "0 0 42px rgba(32, 240, 208, 0.16)",
      },
    },
  },
  plugins: [],
} satisfies Config;
