# Setup Guide

Step-by-step guide to run the observe stack locally.

## Prerequisites

| Requirement | Version |
|-------------|---------|
| Docker Desktop or Docker Engine | 24+ |
| Docker Compose | v2 |
| Node.js (for local examples) | 22+ |
| RAM | 4 GB recommended |

## 1. Start the stack

### Core observability only

```bash
cd observe
docker compose up -d
```

This starts: Loki, Promtail, Prometheus, **Alertmanager**, Grafana, Tempo, OTel Collector, Pushgateway, and node-exporter.

Wait **30–60 seconds** for healthchecks. Alertmanager needs an extra **~15 seconds** for cluster gossip before the UI is fully ready.

### Core stack + NestJS example (recommended)

The NestJS container is behind the Compose profile `examples`. Without it, the `nestjs-example` target in Prometheus stays **DOWN** (expected).

```bash
docker compose --profile examples up -d --build
```

### Verify with script

```bash
chmod +x scripts/verify.sh
./scripts/verify.sh
```

Builds the example apps and, if Docker is running, checks Loki, Prometheus, and Tempo health endpoints.

## 2. Service URLs and health checks

| Service | URL | Health check |
|---------|-----|--------------|
| **Grafana** | http://localhost:3000 | Login: `admin` / `admin` |
| **Prometheus** | http://localhost:9090 | Targets: http://localhost:9090/targets |
| **Alertmanager** | http://127.0.0.1:9093 | `curl http://127.0.0.1:9093/-/healthy` → `OK` |
| **Alertmanager UI** | http://127.0.0.1:9093/#/alerts | Active alerts list |
| **Loki** | http://localhost:3100 | `curl -s http://localhost:3100/ready` |
| **Tempo** | http://localhost:3200 | `curl -s http://localhost:3200/ready` |
| **Pushgateway** | http://localhost:9091 | Metrics UI |
| **OTel Collector** | gRPC `:4317`, HTTP `:4318` | Used by apps, not a browser UI |
| **NestJS example** | http://localhost:3001 | Only with `--profile examples` |
| **React example** | http://localhost:5173 | Run locally with `npm run dev` |

> **Alertmanager:** Use `http://127.0.0.1:9093` (not `https`). The port is bound to `127.0.0.1` in `docker-compose.yml` for compatibility on macOS.

### Prometheus targets (expected state)

| Job | Expected | Notes |
|-----|----------|-------|
| `prometheus` | UP | Self-scrape |
| `alertmanager` | UP | Must be running; see troubleshooting if DOWN |
| `node-exporter` | UP | No host port (internal Docker network only) |
| `pushgateway` | UP | Browser metrics |
| `otel-collector` | UP | Collector metrics on `:8889` |
| `nestjs-example` | UP | Only with `--profile examples` |

In Grafana:

1. **Connections → Data sources** — Prometheus, Loki, Tempo should work.
2. **Dashboards → Observe** — 5 dashboards (System, Application, Database, Traces, Custom).

## 3. NestJS example

### Option A — Docker (profile `examples`)

Already running if you used:

```bash
docker compose --profile examples up -d --build
```

```bash
curl http://localhost:3001/api/health
curl http://localhost:3001/api/test
curl http://localhost:3001/metrics
```

### Option B — Local (Node on host)

Useful when developing instrumentation without rebuilding the image.

```bash
cd backend-integration/nestjs-example
npm install
LOKI_URL=http://localhost:3100 \
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317 \
OTEL_SERVICE_NAME=nestjs-app \
npm run start:dev
```

Generate traffic:

```bash
curl http://localhost:3001/api/health
curl http://localhost:3001/api/test
curl http://localhost:3001/api/slow
curl http://localhost:3001/api/error
```

**Verify:**

| Signal | Where |
|--------|--------|
| Metrics | Prometheus → query `http_requests_total` |
| Logs | Grafana Explore → Loki → `{job="nestjs-app"}` |
| Traces | Grafana → Traces dashboard or Explore → Tempo |

## 4. React example

```bash
cd frontend-integration/react-example
cp .env.example .env
npm install
npm run dev
```

Open http://localhost:5173. Click the buttons to call the NestJS API and push RUM metrics.

**Verify:**

| Signal | Where |
|--------|--------|
| RUM metrics | http://localhost:9091 → job `web-app` |
| Traces | Grafana → Tempo → services `web-app` and `nestjs-app` |

Ensure the NestJS API is reachable at `VITE_API_URL` (default `http://localhost:3001`).

## 5. Alerts

Pre-defined rules live in `prometheus/alerting-rules.yml` (error rate, P99 latency, service down, memory).

### View firing alerts

1. **Prometheus:** http://localhost:9090/alerts
2. **Alertmanager:** http://127.0.0.1:9093/#/alerts

### Generate test alerts

```bash
for i in $(seq 1 30); do curl -s http://localhost:3001/api/error; done
```

Wait 5–10 minutes for `for:` durations in rules to elapse.

### Slack notifications (production)

Edit `alertmanager/config.yml`. The default config uses a **no-op receiver** so Alertmanager starts without a valid Slack URL.

Add a Slack receiver (example):

```yaml
receivers:
  - name: slack
    slack_configs:
      - api_url: 'https://hooks.slack.com/services/T00/B00/XXXXXXXX'
        channel: '#alerts'
        send_resolved: true

route:
  receiver: slack
  # ... existing routes ...
```

Then restart:

```bash
docker compose up -d alertmanager --force-recreate
```

## 6. Environment variables

Copy `.env.example` to `.env` for reference. Compose services use inline env; examples use their own `.env` files.

| Variable | Used by | Default (local) |
|----------|---------|-----------------|
| `LOKI_URL` | NestJS | `http://localhost:3100` |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | NestJS | `http://localhost:4317` |
| `OTEL_SERVICE_NAME` | NestJS | `nestjs-app` |
| `VITE_API_URL` | React | `http://localhost:3001` |
| `VITE_PUSHGATEWAY_URL` | React | `http://localhost:9091` |
| `VITE_OTEL_EXPORTER_OTLP_ENDPOINT` | React | `http://localhost:4318/v1/traces` |

## 7. Stop and reset

```bash
# Stop containers (keep data)
docker compose --profile examples down

# Stop and delete volumes (fresh start)
docker compose --profile examples down -v
```

## Troubleshooting

### Alertmanager not available on :9093

1. Check container status:
   ```bash
   docker compose ps alertmanager
   docker compose logs alertmanager --tail 30
   ```
2. If you see `unsupported scheme "" for URL` — an invalid `api_url` (e.g. `YOUR_SLACK_WEBHOOK_URL` without `https://`) crashed Alertmanager. Use the current `alertmanager/config.yml` (no-op receiver).
3. Restart and wait ~15s:
   ```bash
   docker compose up -d alertmanager --force-recreate
   curl http://127.0.0.1:9093/-/healthy
   ```
4. Use **http://127.0.0.1:9093** in the browser, not https.

### `nestjs-example` target DOWN in Prometheus

- Start with profile: `docker compose --profile examples up -d --build`
- Or run NestJS locally on port 3001 (see section 3B)
- Wait one scrape interval (15s) after the app is up

### Port 9100 already in use

`node-exporter` does **not** publish port 9100 on the host. Prometheus scrapes it on the internal `observe` network. Re-run `docker compose up -d` after pulling the latest `docker-compose.yml`.

### Grafana dashboards empty

- Generate traffic: `curl http://localhost:3001/api/test`
- Wait 15–30s for scrape and refresh
- Confirm targets are UP at http://localhost:9090/targets

### No logs in Loki

- Confirm NestJS has `LOKI_URL` pointing to Loki
- Do not set `ENABLE_LOKI=false`
- In Explore: `{job="nestjs-app"}`

### Traces missing in Tempo

- Confirm OTel Collector is up: `docker compose ps otel-collector`
- Backend: `OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317`
- Frontend: `VITE_OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318/v1/traces`
- CORS: collector allows `http://localhost:5173`

### Port 3000 in use (Grafana)

Change in `docker-compose.yml`:

```yaml
grafana:
  ports:
    - "3002:3000"
```

Then open http://localhost:3002.

## End-to-end checklist

- [ ] `docker compose --profile examples up -d --build`
- [ ] http://localhost:9090/targets — all expected jobs UP
- [ ] http://127.0.0.1:9093/-/healthy returns OK
- [ ] Grafana — 3 datasources, 5 dashboards in folder **Observe**
- [ ] `curl http://localhost:3001/api/test` — metrics, logs, traces visible
- [ ] React `npm run dev` — Pushgateway job `web-app`, distributed trace in Tempo
- [ ] Optional: `/api/error` traffic → alerts in Prometheus and Alertmanager
