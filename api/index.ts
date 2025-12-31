import "dotenv/config";
import express from "express";
import { registerRoutes } from "../server/routes";
import { setupVite, serveStatic } from "../server/vite";

const app = express();

// Configure Content Security Policy for Vite dev server and Mapbox
app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; " +
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://api.mapbox.com; " +
      "style-src 'self' 'unsafe-inline' https://api.mapbox.com https://fonts.googleapis.com; " +
      "img-src 'self' data: https: blob:; " +
      "font-src 'self' https://api.mapbox.com https://fonts.gstatic.com; " +
      "connect-src 'self' https://api.mapbox.com https://*.mapbox.com wss:; " +
      "worker-src 'self' blob:;"
  );
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Register API routes
registerRoutes(app);

// In production, serve the built client files
if (process.env.NODE_ENV === "production") {
  serveStatic(app);
} else {
  setupVite(app);
}

// Export the Express app as a Vercel serverless function
export default app;
