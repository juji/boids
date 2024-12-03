import { defineConfig } from 'vite'

const viteHeaderPlugin = {
  name: 'add headers',
  configureServer: (server) => {
    server.middlewares.use((req, res, next) => {
      res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
      res.setHeader("Cross-Origin-Embedder-Policy", "credentialless");
      next();
    });
  }
};


export default defineConfig({
  plugins: [ viteHeaderPlugin ]
})