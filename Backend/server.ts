import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { createPasopkanServer } from "./app.ts";

async function startServer() {
  // Initialize modular Pasopkan Express server with all routes & middlewares
  const app = createPasopkanServer();
  const PORT = 3000;

  // --- Serve Frontend Application ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Pasopkan Server] Running on http://0.0.0.0:${PORT}`);
  });
}


process.on('unhandledRejection', (reason, promise) => {
  console.warn('[Server Unhandled Rejection Caught Safely]:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('[Server Uncaught Exception Caught Safely]:', error);
});

startServer().catch((err) => {
  console.error("[Pasopkan Server] Unhandled error starting server:", err);
});

