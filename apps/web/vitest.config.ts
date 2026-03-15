import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}", "**/*.test.{ts,tsx}"],
    alias: {
      "@": path.resolve(__dirname, "."),
      "@wisdom-journal/shared": path.resolve(
        __dirname,
        "../../packages/shared/src"
      ),
    },
  },
});
