import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { AuthService } from "./services/auth.service.js";
import { AssetService } from "./services/asset.service.js";
import { createVehiclesRouter } from "./routes/vehicles.js";
import { createUsersRouter } from "./routes/users.js";
import { createAlarmsRouter } from "./routes/alarms.js";
import { PushTokenStore } from "./services/push-token.store.js";
import { AlarmService } from "./services/alarm.service.js";
import { PushService } from "./services/push.service.js";
import { AlarmPollerService } from "./services/alarm-poller.service.js";
dotenv.config();
function validateEnv() {
    const required = ["OPENREMOTE_URL", "OPENREMOTE_REALM", "CLIENT_ID", "CLIENT_SECRET"];
    const missing = required.filter((key) => !process.env[key]);
    if (missing.length > 0) {
        console.error(`Missing required environment variables: ${missing.join(", ")}`);
        process.exit(1);
    }
}
validateEnv();
const app = express();
const port = Number(process.env.PORT) || 3000;
app.use(cors());
app.use(express.json());
const authService = new AuthService();
const assetService = new AssetService(authService);
const pushTokenStore = new PushTokenStore();
const alarmService = new AlarmService(authService);
const pushService = new PushService();
const alarmPollIntervalMs = Number(process.env.ALARM_POLL_INTERVAL_MS) || 30000;
const alarmPoller = new AlarmPollerService({
    alarmService,
    pushTokenStore,
    pushService,
    intervalMs: alarmPollIntervalMs,
});
app.use("/api", createVehiclesRouter(assetService));
app.use(createUsersRouter(pushTokenStore));
app.use(createAlarmsRouter(alarmService));
app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
});
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log(`Alarm poller interval: ${alarmPollIntervalMs}ms`);
    alarmPoller.start();
});
process.on("SIGINT", () => {
    alarmPoller.stop();
    process.exit(0);
});
process.on("SIGTERM", () => {
    alarmPoller.stop();
    process.exit(0);
});
export { app };
