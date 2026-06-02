import { Request, Response, Router } from "express";
import { AlarmService } from "../services/alarm.service.js";

interface AlarmQuery {
  status?: string;
  severity?: string;
}

export function createAlarmsRouter(alarmService: AlarmService): Router {
  const router = Router();

  router.get("/alarms", async (req: Request<unknown, unknown, unknown, AlarmQuery>, res: Response) => {
    try {
      const alarms = await alarmService.fetchAlarms({
        status: req.query.status,
        severity: req.query.severity,
      });
      res.json(alarms);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error fetching alarms";
      res.status(502).json({ error: message });
    }
  });

  router.put("/alarms/:id/acknowledge", async (req: Request<{ id: string }>, res: Response) => {
    try {
      const result = await alarmService.acknowledgeAlarm(req.params.id);
      res.json(result ?? { status: "acknowledged" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error acknowledging alarm";
      res.status(502).json({ error: message });
    }
  });

  router.put("/alarms/:id/resolve", async (req: Request<{ id: string }>, res: Response) => {
    try {
      const result = await alarmService.resolveAlarm(req.params.id);
      res.json(result ?? { status: "resolved" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error resolving alarm";
      res.status(502).json({ error: message });
    }
  });

  return router;
}
