import { Router } from "express";
function getAuthenticatedUserId(req) {
    const userIdHeader = req.header("x-user-id");
    if (!userIdHeader || userIdHeader.trim().length === 0) {
        return null;
    }
    return userIdHeader.trim();
}
export function createUsersRouter(pushTokenStore) {
    const router = Router();
    router.post("/users/push-token", (req, res) => {
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
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Failed to store push token";
            res.status(400).json({ error: message });
        }
    });
    return router;
}
