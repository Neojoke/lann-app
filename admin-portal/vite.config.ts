import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@components": path.resolve(__dirname, "./src/renderer/components"),
      "@providers": path.resolve(__dirname, "./src/renderer/providers"),
      "@catalog": path.resolve(__dirname, "./src/catalog")
    }
  },
  server: {
    port: 3000,
    proxy: {
      "/admin/api": {
        target: "http://localhost:8787",
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: "dist",
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          "ionic-core": ["@ionic/react", "@ionic/core"],
          "react-vendor": ["react", "react-dom", "react-router-dom"]
        }
      }
    }
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./test/setup.ts"],
    css: true
  }
});
