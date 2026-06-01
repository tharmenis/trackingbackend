import { Router, Request, Response } from "express";
import { AssetService } from "../services/asset.service.js";

export function createVehiclesRouter(assetService: AssetService): Router {
  const router = Router();

  router.post("/vehicles", async (_req: Request, res: Response) => {
    try {
      const vehicles = await assetService.fetchVehicles();
      res.json(vehicles);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error fetching vehicles";
      res.status(502).json({ error: message });
    }
  });

  return router;
}
