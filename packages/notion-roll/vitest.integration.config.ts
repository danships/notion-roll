import { defineConfig } from "vitest/config";
import { config } from "dotenv";
import { resolve } from "node:path";

// Load .env from project root
config({ path: resolve(__dirname, "../../.env") });

export default defineConfig({
  test: {
    include: ["tests/integration/**/*.test.ts"],
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
});
