import { Router } from "express";
export function createVehiclesRouter(assetService) {
    const router = Router();
    router.post("/vehicles", async (_req, res) => {
        try {
            const vehicles = await assetService.fetchVehicles();
            res.json(vehicles);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Unknown error fetching vehicles";
            res.status(502).json({ error: message });
        }
    });
    return router;
}
