import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    server: { port: 8000 },
    resolve: {
        alias: {
            '@components': path.resolve(__dirname, 'src/components'),
            '@features': path.resolve(__dirname, 'src/features'),
            '@utils': path.resolve(__dirname, 'src/utils'),
            '@validation': path.resolve(__dirname, 'src/validation'),
            '@assets': path.resolve(__dirname, 'src/assets'),
            '@src': path.resolve(__dirname, 'src'),
            '@public': path.resolve(__dirname, 'public'),
        },
    },
});
