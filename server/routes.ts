import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import routesHandler from "../api/routes";

export async function registerRoutes(app: Express): Promise<Server> {
  app.all("/api/routes", (req, res) => routesHandler(req as any, res as any));

  // Endpoint to serve Mapbox token to frontend
  app.get("/api/config", (req, res) => {
    res.json({
      mapboxToken: process.env.MAPBOX_ACCESS_TOKEN || '',
    });
  });

  const httpServer = createServer(app);

  return httpServer;
}
