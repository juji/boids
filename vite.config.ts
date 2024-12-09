import { defineConfig } from 'vite'
import glsl from 'vite-plugin-glsl';

const viteHeaderPlugin = {
  name: 'add headers',
  configureServer: (server) => {
    server.middlewares.use((req, res, next) => {
      res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
      res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
      next();
    });
  }
};


export default defineConfig({
  plugins: [ 
    viteHeaderPlugin,
    glsl(),
  ]
})