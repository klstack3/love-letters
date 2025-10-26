import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // Endpoint to serve Mapbox token to frontend
  app.get("/api/config", (req, res) => {
    res.json({
      mapboxToken: process.env.MAPBOX_ACCESS_TOKEN || '',
    });
  });

  const httpServer = createServer(app);

  return httpServer;
}
