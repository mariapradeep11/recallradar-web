import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

function localApiPlugin(): Plugin {
  return {
    name: "recallradar-local-api",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use("/api/recalls", async (req, res) => {
        const { default: handler } = await import("./api/recalls.js");
        const url = new URL(req.url || "", "http://localhost");
        const query = Object.fromEntries(url.searchParams.entries());

        await handler(
          { method: req.method, query, headers: req.headers },
          {
            status(code: number) {
              res.statusCode = code;
              return this;
            },
            setHeader(name: string, value: string) {
              res.setHeader(name, value);
              return this;
            },
            json(body: unknown) {
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify(body));
            },
          }
        );
      });

      server.middlewares.use("/api/waitlist", async (req, res) => {
        const chunks: Buffer[] = [];
        for await (const chunk of req) chunks.push(Buffer.from(chunk));
        const raw = Buffer.concat(chunks).toString("utf8");
        const body = raw ? JSON.parse(raw) : {};
        const { default: handler } = await import("./api/waitlist.js");

        await handler(
          { method: req.method, headers: req.headers, body },
          {
            status(code: number) {
              res.statusCode = code;
              return this;
            },
            json(payload: unknown) {
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify(payload));
            },
          }
        );
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), localApiPlugin()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/three") || id.includes("@react-three")) {
            return "three-vendor";
          }
          if (id.includes("node_modules/framer-motion")) {
            return "motion-vendor";
          }
        },
      },
    },
  },
})
