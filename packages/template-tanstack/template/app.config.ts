import { defineConfig } from '@tanstack/start/config';
import { TanStackRouterVite } from '@tanstack/router-plugin/vite';
import viteTsConfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  vite: {
    plugins: [
      TanStackRouterVite(),
      viteTsConfigPaths({
        projects: ['./tsconfig.json'],
      }),
    ],
  },
});