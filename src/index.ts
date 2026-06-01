import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { AuthService } from "./services/auth.service.js";
import { AssetService } from "./services/asset.service.js";
import { createVehiclesRouter } from "./routes/vehicles.js";

dotenv.config();

function validateEnv(): void {
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

app.use("/api", createVehiclesRouter(assetService));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

export { app };
