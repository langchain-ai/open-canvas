import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import viteTsConfigPaths from 'vite-tsconfig-paths';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.smoke.test.ts', 'src/**/graph.smoke.test.ts'],
    passWithNoTests: false,
  },
  plugins: [
    viteTsConfigPaths()
  ],
  resolve: {
    alias: {
      '@opencanvas/shared/utils/artifacts': resolve(__dirname, 'src/test/mocks/artifacts.stub.ts'),
    }
  }
});