import { Request, Response, Router } from "express";
import { PushTokenStore } from "../services/push-token.store.js";

interface PushTokenBody {
  expoPushToken?: unknown;
}

function getAuthenticatedUserId(req: Request): string | null {
  const userIdHeader = req.header("x-user-id");
  if (!userIdHeader || userIdHeader.trim().length === 0) {
    return null;
  }

  return userIdHeader.trim();
}

export function createUsersRouter(pushTokenStore: PushTokenStore): Router {
  const router = Router();

  router.post("/users/push-token", (req: Request, res: Response) => {
    const userId = getAuthenticatedUserId(req);
    if (!userId) {
      res.status(401).json({ error: "Missing authenticated user context" });
      return;
    }

    const expoPushToken = req.body?.expoPushToken;
    if (typeof expoPushToken !== "string" || expoPushToken.trim().length === 0) {
      res.status(400).json({ error: "expoPushToken is required" });
      return;
    }

    try {
      pushTokenStore.upsert(userId, expoPushToken.trim());
      res.status(204).send();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to store push token";
      res.status(400).json({ error: message });
    }
  });

  return router;
}
