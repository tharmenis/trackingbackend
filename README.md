# Vehicle Tracking Server

Backend proxy that authenticates with an OpenRemote instance and exposes vehicle asset data to the frontend client. Keeps service account credentials secure by never exposing them to the browser.

## Architecture

```
server/
├── src/
│   ├── index.ts              # Express app entry point
│   ├── routes/
│   │   └── vehicles.ts       # Route handlers
│   └── services/
│       ├── auth.service.ts   # OAuth2 token management
│       └── asset.service.ts  # OpenRemote asset querying & parsing
├── package.json
└── tsconfig.json
```

### The flow

1. Client sends `POST /api/vehicles`
2. Server authenticates with OpenRemote Keycloak (client_credentials grant)
3. Server queries OpenRemote asset API for vehicle assets
4. Server parses raw OpenRemote response into `VehicleAsset[]`
5. Server returns parsed data to client

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENREMOTE_URL` | Yes | Base URL of your OpenRemote instance (e.g. `https://openremote.example.com`) |
| `OPENREMOTE_REALM` | Yes | Realm name containing the vehicle assets |
| `CLIENT_ID` | Yes | Service account client ID |
| `CLIENT_SECRET` | Yes | Service account client secret |
| `PORT` | No | Server port (default: `3000`) |

Create a `.env` file in the `server/` directory:

```env
OPENREMOTE_URL=https://your-openremote-instance.com
OPENREMOTE_REALM=your-realm
CLIENT_ID=your-client-id
CLIENT_SECRET=your-client-secret
PORT=3000
```

## API Endpoints

### `POST /api/vehicles`

Fetches all vehicle assets from the configured OpenRemote realm.

**Request:** No body required.

**Success Response (200):**

```json
[
  {
    "id": "abc123",
    "name": "Vehicle A",
    "type": "CarAsset",
    "location": { "lat": 37.7749, "lng": -122.4194 },
    "speed": 45.2,
    "heading": 180,
    "status": "ONLINE",
    "lastUpdated": 1717200000000
  },
  {
    "id": "def456",
    "name": "Vehicle B",
    "type": "VehicleAsset",
    "location": null,
    "speed": null,
    "heading": null,
    "status": "OFFLINE",
    "lastUpdated": 0
  }
]
```

**Error Response (502):**

```json
{
  "error": "Authentication failed (HTTP 401): invalid_client"
}
```

Returned when the server cannot authenticate with OpenRemote or the asset query fails.

---

### `GET /health`

Health check endpoint.

**Response (200):**

```json
{ "status": "ok" }
```

## Data Model

### VehicleAsset

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | OpenRemote asset ID |
| `name` | `string` | Display name of the vehicle |
| `type` | `string` | OpenRemote asset type (e.g. `CarAsset`, `VehicleAsset`) |
| `location` | `{ lat, lng } \| null` | Current GPS position (null if unavailable) |
| `speed` | `number \| null` | Speed in km/h (null if unavailable) |
| `heading` | `number \| null` | Heading in degrees (null if unavailable) |
| `status` | `"ONLINE" \| "OFFLINE"` | Online if last update within 5 minutes |
| `lastUpdated` | `number` | Epoch ms of most recent attribute update |

## Authentication Details

The server uses OAuth2 **client_credentials** grant to authenticate with OpenRemote's Keycloak:

- Token endpoint: `{OPENREMOTE_URL}/auth/realms/{OPENREMOTE_REALM}/protocol/openid-connect/token`
- Tokens are cached in memory and auto-refreshed 30 seconds before expiry
- No manual token management needed

## Asset Query Details

The server queries OpenRemote's asset API:

- Endpoint: `POST {OPENREMOTE_URL}/api/{OPENREMOTE_REALM}/asset/query`
- Filters by types: `ThingAsset`, `CarAsset`, `VehicleAsset`
- Parses GeoJSON Point locations, speed, direction/heading attributes
- Determines online/offline status based on 5-minute recency threshold

## Running

```bash
# Development (with hot-reload)
npm run dev

# Production build
npm run build
npm start

# Run tests
npm test
```

## Deployment Notes

- The server is a standard Node.js/Express app — deploy anywhere that runs Node 18+
- Ensure environment variables are set in your deployment environment
- The `/health` endpoint can be used for load balancer health checks
- CORS is enabled by default (all origins) — restrict in production if needed


## Notifications & Alarms

The middleware now owns push delivery for alarms and does not rely on OpenRemote push pipelines.

### Dependency

- `expo-server-sdk`

### Push Token Endpoint

#### `POST /users/push-token`

Stores an Expo push token for the authenticated user.

Authentication context:
- Current implementation expects `x-user-id` request header (set by your auth gateway/backend).

Request body:

```json
{
  "expoPushToken": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]"
}
```

Responses:
- `204` on success
- `400` for missing/invalid token
- `401` when `x-user-id` is missing

Note: push tokens are currently stored in memory and reset on service restart.

### Alarms API (Frontend)

#### `GET /alarms`

Returns alarms from OpenRemote.

Optional query params:
- `status` (example: `OPEN`)
- `severity` (example: `HIGH`)

#### `PUT /alarms/:id/acknowledge`

Proxies acknowledge action to OpenRemote.

#### `PUT /alarms/:id/resolve`

Proxies resolve action to OpenRemote.

### Alarms Poller

The service runs a poller that:

- polls OpenRemote alarms (`GET /api/{realm}/alarm`) for `OPEN` + `HIGH`
- detects new alarms by ID
- finds assigned user push token
- sends Expo push notification

Configuration:

| Variable | Required | Description |
|----------|----------|-------------|
| `ALARM_POLL_INTERVAL_MS` | No | Poll interval in milliseconds (default: `30000`) |

### Push Payload

High severity notifications include deep-link payload fields in `data`:

```json
{
  "type": "alarm",
  "alarmId": "<alarm-id>",
  "severity": "HIGH",
  "title": "<alarm-title>"
}
```

### Open Items

- Evaluate polling vs websocket/MQTT for lower-latency alarm delivery.
- Finalize which vehicle rule conditions create alarms in OpenRemote When-Then rules.


### Regenerate lockfile and push again

git checkout main
git pull --rebase origin main

rm -rf node_modules package-lock.json
npm install
npm ci

git add package.json package-lock.json
git commit -m "Refresh lockfile"
git push origin main