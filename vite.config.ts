import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import dts from 'vite-plugin-dts';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), dts()],
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'react-matrix-sdk',
      fileName: (format: string) => `index.${format}.js`,
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'matrix-js-sdk'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'matrix-js-sdk': 'MatrixJsSdk',
        },
      },
    },
    sourcemap: true,
    emptyOutDir: true,
  }
});
