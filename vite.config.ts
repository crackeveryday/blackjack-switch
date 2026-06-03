import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/blackjack-switch/",
  plugins: [react()],
  test: {
    environment: "node",
    globals: true,
  },
});
