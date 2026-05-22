<div align="center">

# Loka

<img width="150" height="150" alt="loka_simple_icon" src="https://github.com/user-attachments/assets/a1db3ca8-aab7-43cf-baf2-06fe3b93d59f" />
<svg width="100%" viewBox="0 0 200 200" role="img" style="margin: 0px auto;" xmlns="http://www.w3.org/2000/svg">
  
  <!-- Outer circle -->
  <circle cx="100" cy="100" r="70" fill="none" stroke="#9333ea" stroke-width="3" style="fill:none;stroke:rgb(147, 51, 234);color:rgb(255, 255, 255);stroke-width:3px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family:&quot;Anthropic Sans&quot;, -apple-system, &quot;system-ui&quot;, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
  
  <!-- Center dot -->
  <circle cx="100" cy="100" r="12" fill="#9333ea" style="fill:rgb(147, 51, 234);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family:&quot;Anthropic Sans&quot;, -apple-system, &quot;system-ui&quot;, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
</svg>

# Open Observability Stack

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
![Version](https://img.shields.io/badge/Version-1.0.0-blue)
![Status: Stable](https://img.shields.io/badge/Status-Stable-green)
![Docker Compose](https://img.shields.io/badge/Docker%20Compose-v2.24+-blue)

</div>

> Spin up complete observability in minutes. **Logs**, **metrics**, **traces**, and **dashboards** with Docker Compose + Grafana + Loki + Prometheus + Tempo. No managed services. Full control.

**Perfect for:** Local development, small deployments (1–10 services, 10–100 RPS), testing observability workflows.

---

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [Project Layout](#project-layout)
- [Examples](#examples)
- [Dashboards](#dashboards)
- [Verification & Testing](#verification--testing)
- [Alerts & Configuration](#alerts--configuration)
- [Troubleshooting](#troubleshooting)
- [Documentation](#documentation)
- [License](#license)

---

## Overview

Production-style monitoring for local development and small deployments—without managed-service complexity.

### What You Get

| Pillar | Stack | Version |
|--------|-------|---------|
| **Logs** | Loki + Promtail + Pino (`pino-loki`) | Loki 3.4.2, Promtail 3.4.2 |
| **Metrics** | Prometheus + Pushgateway (browser RUM) | Prometheus 3.2.1 |
| **Traces** | Grafana Tempo + OpenTelemetry Collector | Tempo 2.7.1 |
| **Dashboards** | Grafana | Grafana 11.5.2 |
| **Alerts** | Prometheus rules + Alertmanager | Alertmanager 0.28.1 |
| **Examples** | NestJS API (v11) + React + Vite | NestJS 11.0.12, React 19 |

---

## Quick Start

### Prerequisites

- Docker & Docker Compose (v2.24+)
- 2GB+ available RAM
- Ports 3000–3200, 4317–4318, 5173, 9090–9093 available

### Launch (60 seconds)

```bash
# Clone & navigate
git clone https://github.com/faharid/loka
cd loka

# Full stack + NestJS demo
docker compose --profile examples up -d --build

# OR core stack only (no NestJS container)
docker compose up -d
```

Wait ~60 seconds for services to initialize, then open:

| Service | URL | Login | Purpose |
|---------|-----|-------|---------|
| **Grafana** | http://localhost:3000 | `admin` / `admin` | Dashboards, Explore, Alerts UI |
| **Prometheus** | http://localhost:9090/targets | — | Metrics storage, scrape targets |
| **Alertmanager** | http://127.0.0.1:9093/#/alerts | — | Alert routing & history |
| **Pushgateway** | http://localhost:9091 | — | Browser metrics ingress |
| **Tempo** | http://localhost:3200 (via Grafana) | — | Distributed trace viewer |

> **Tip:** Run `./scripts/verify.sh` to validate all services are healthy.

![Dashboard Screenshot](./docs/images/dashboard-screenshot.png)  
*[Placeholder: Grafana dashboard with System + Application views]*

---

## Architecture

### High-Level Flow

```
┌───────────────────────────────────────────────────┐
│ Applications (NestJS, React, your services)       │
└──┬──────────────────┬──────────────────┬──────────┘
   │ (Logs)           │ (Metrics)        │ (Traces)
   ▼                  ▼                  ▼
┌─────────────┐  ┌──────────────┐  ┌────────────┐
│ Promtail    │  │ Prometheus   │  │ OTel       │
│ (docker,    │  │ (scrape)     │  │ Collector  │
│  files)     │  │ Pushgateway  │  │            │
└──┬──────────┘  └──────┬───────┘  └──────┬─────┘
   │                    │                 │
   ▼                    ▼                 ▼
┌─────────────┐  ┌──────────────┐  ┌────────────┐
│ Loki        │  │ Prometheus   │  │ Tempo      │
│ (log store) │  │ (TSDB)       │  │ (traces)   │
└──────┬──────┘  └──────┬───────┘  └──────┬─────┘
       └──────────────┬───────────────────┘
                      │
                      ▼
              ┌─────────────────┐
              │ Grafana         │
              │ + Alertmanager  │
              └─────────────────┘
```

**Full architecture details:** [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

### Component Versions

See [docs/ARCHITECTURE.md#components](docs/ARCHITECTURE.md#components) for complete service images and roles.

---

## Project Layout

```
loka/
├── README.md                          # This file
├── docker-compose.yml                 # Service definitions & profiles
├── .env.example                       # Environment template
├── LICENSE                            # MIT
│
├── docs/
│   ├── SETUP.md                       # Installation & troubleshooting
│   ├── ARCHITECTURE.md                # Components, data flows, ports
│   └── DASHBOARDS.md                  # Grafana customization guide
│
├── backend-integration/nestjs-example/
│   ├── src/
│   ├── package.json                   # NestJS 11, OpenTelemetry, Pino
│   └── README.md                      # Local setup
│
├── frontend-integration/react-example/
│   ├── src/
│   ├── package.json                   # React 19, Vite, OTel Web SDK
│   └── .env.example                   # CORS & endpoint config
│
├── grafana/
│   ├── provisioning/
│   │   ├── dashboards/                # 5 pre-built JSON dashboards
│   │   └── datasources/               # Loki, Prometheus, Tempo links
│   └── config/                        # Custom plugins, settings
│
├── prometheus/
│   ├── prometheus.yml                 # Scrape targets, Alertmanager config
│   └── alerting-rules.yml             # Alert rules (error rate, latency, etc)
│
├── alertmanager/
│   └── config.yml                     # Routes, receivers, Slack webhook
│
├── loki/
│   └── loki-config.yml                # Retention (default 72h), storage
│
├── promtail/
│   └── promtail-config.yml            # Docker & file log scraping
│
├── tempo/
│   └── tempo.yaml                     # Trace storage backend
│
├── otel-collector/
│   └── config.yaml                    # OTLP pipelines (gRPC + HTTP)
│
├── scripts/
│   └── verify.sh                      # Health check script
│
└── logs/
    └── nestjs/                        # Local log directory for Promtail
```

---

## Examples

### NestJS Backend (v11.0.12)

Demonstrates logs, metrics, and traces in a Node.js HTTP API.

#### Run in Docker (with full stack)

```bash
docker compose --profile examples up -d --build
```

Endpoints become available at `http://localhost:3001`:

| Endpoint | Purpose | Observability |
|----------|---------|----------------|
| `GET /api/health` | Health check | Logs + metrics |
| `GET /api/test` | Normal request | Full trace, database span |
| `GET /api/slow` | Slow query (2s) | Trace with latency warning |
| `GET /api/error` | 500 error | Error trace, alert trigger |
| `GET /metrics` | Prometheus format | Custom metrics (requests, latency) |

**Trace & log a request:**

```bash
curl http://localhost:3001/api/test
# Then search Grafana > Explore > Tempo for the trace
```

#### Run Locally

```bash
cd backend-integration/nestjs-example
npm install

# Terminal 1: Start NestJS with hot-reload
LOKI_URL=http://localhost:3100 \
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317 \
npm run start:dev

# Terminal 2: Trigger test requests
curl http://localhost:3001/api/test
curl http://localhost:3001/api/slow
curl http://localhost:3001/api/error
```

**Environment variables:**

```bash
LOKI_URL=http://localhost:3100          # Loki gRPC for logs
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317  # OTel Collector gRPC
OTEL_SERVICE_NAME=nestjs-app            # Trace service name
PORT=3001                               # HTTP listen port
LOG_LEVEL=info                          # Pino log level
ENABLE_LOKI=true                        # Disable with false
```

**See also:** [backend-integration/nestjs-example/README.md](backend-integration/nestjs-example/README.md)

### React Frontend (19 + Vite)

Browser-based RUM (Real User Monitoring) and Web Vitals.

```bash
cd frontend-integration/react-example
cp .env.example .env
npm install
npm run dev
# Opens http://localhost:5173
```

**Features:**

- Automatic Web Vitals tracking (FCP, LCP, CLS)
- User interactions traced (clicks, navigation)
- API latency correlation
- Push metrics to Pushgateway (job: `web-app`)

**Environment:**

```bash
VITE_API_URL=http://localhost:3001
VITE_PUSHGATEWAY_URL=http://localhost:9091
VITE_OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318/v1/traces
VITE_OTEL_SERVICE_NAME=web-app
```

**See also:** [frontend-integration/react-example/README.md](frontend-integration/react-example/README.md)

---

## Dashboards

Pre-built Grafana dashboards (auto-provisioned):

| Dashboard | Panels | Data Sources | Use Case |
|-----------|--------|--------------|----------|
| **System** | CPU, Memory, Disk, Network | Prometheus (node-exporter) | Host health |
| **Application** | RPS, Latency (P50/P95/P99), Error rate, Top logs | Prometheus + Loki | App performance |
| **Database** | Query duration, Pool, Slow queries | Prometheus (via app metrics) | DB bottlenecks |
| **Traces** | Trace search, Error traces, Service map | Tempo | Distributed debugging |
| **Custom** | Empty template | Any | Your metrics |

**Customize:** [docs/DASHBOARDS.md](docs/DASHBOARDS.md)

![Grafana Dashboards](./docs/images/grafana-dashboards.png)  
*[Placeholder: Grafana dashboard screenshots showing System, Application, and Traces tabs]*

---

## Verification & Testing

### Quick Health Check

```bash
./scripts/verify.sh
```

**Output example:**

```
✓ Grafana: http://localhost:3000 (200 OK)
✓ Prometheus: http://localhost:9090 (200 OK)
✓ Loki: http://localhost:3100 (200 OK)
✓ Alertmanager: http://127.0.0.1:9093 (200 OK)
✓ OTel Collector: http://localhost:4318 (400 — expected, no body)
✓ All 6/6 services healthy
```

### Manual Test Workflow

#### 1. **Generate observability data**

```bash
# NestJS normal request
curl http://localhost:3001/api/test

# Slow query
curl http://localhost:3001/api/slow

# Error trace
curl http://localhost:3001/api/error

# Browser (React)
open http://localhost:5173
# Click around to generate metrics in Prometheus
```

#### 2. **Check Prometheus scrape targets**

Open http://localhost:9090/targets — should see all 4 UP:
- `prometheus` (self)
- `nestjs-app` (if `--profile examples`)
- `node-exporter` (internal)
- `otel-collector` (metrics from OTLP)

#### 3. **Explore logs (Loki)**

Grafana > Explore > Loki > Run query:

```logql
{job="nestjs-app"} | json
```

Or filter by level:

```logql
{job="nestjs-app", level="error"}
```

#### 4. **View traces (Tempo)**

Grafana > Explore > Tempo > Search:
- Service: `nestjs-app`
- Span Name: `/api/test`
- Status: any

Then **click trace** to see full waterfall with log correlation.

#### 5. **Check alerts**

Prometheus: http://localhost:9090/alerts  
Alertmanager: http://127.0.0.1:9093/#/alerts

Trigger a test alert:

```bash
# Hit /api/error 10+ times rapidly
for i in {1..15}; do curl http://localhost:3001/api/error; done
```

Alert should fire: `AlertErrorRateHigh` (> 1%)

#### 6. **Export Metrics**

```bash
# Prometheus (scrape format)
curl http://localhost:3001/metrics

# Pushgateway (browser metrics)
curl http://localhost:9091/metrics
```

### Running NestJS Unit Tests

```bash
cd backend-integration/nestjs-example
npm test
npm run test:e2e
```

### Running React Tests

```bash
cd frontend-integration/react-example
npm test
```

---

## Alerts & Configuration

### Alert Rules

Edit: `prometheus/alerting-rules.yml`

| Alert | Condition | Severity | Action |
|-------|-----------|----------|--------|
| `ErrorRateHigh` | Error rate > 1% (warning) or > 5% (critical) | P2/P1 | Check Grafana > Application dashboard |
| `LatencyHigh` | P99 latency > 1s | P2 | Profile database or downstream services |
| `ServiceDown` | `nestjs-example` scrape fails | P1 | `docker compose --profile examples up -d --build` |
| `MemoryHigh` | Host memory > 80% | P2 | Scale up / reduce retention |

### Slack Integration (Optional)

1. Create a Slack webhook: https://api.slack.com/messaging/webhooks
2. Edit `alertmanager/config.yml`:

```yaml
receivers:
  - name: 'slack'
    slack_configs:
      - api_url: 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL'
        channel: '#alerts'
        title: 'Observe Alert'
```

3. Restart Alertmanager:

```bash
docker compose restart alertmanager
```

### Loki Retention

Edit: `loki/loki-config.yml` → `limits_config.retention_period`

Default: `72h` (3 days)

```yaml
limits_config:
  retention_period: 72h  # Change to 24h, 168h (7d), etc
```

Restart: `docker compose up -d loki`

---

## Troubleshooting

| Issue | Symptom | Fix |
|-------|---------|-----|
| **Alertmanager won't start** | Connection refused on 127.0.0.1:9093 | `docker compose up -d alertmanager --force-recreate` (wait 20s for gossip) |
| **NestJS DOWN** | Prometheus /targets shows DOWN | `docker compose --profile examples up -d --build` |
| **Empty dashboards** | Grafana shows "No data" | 1. Run `curl http://localhost:3001/api/test` 2. Wait 30s for Prometheus scrape 3. Refresh Grafana |
| **Port 9100 in use** | `bind: address already in use` | Expected — node-exporter only runs on internal network. No action needed. |
| **OTel Collector errors** | Logs show "failed to export traces" | Check `otel-collector/config.yaml` OTLP receivers; ensure app endpoints match (`localhost:4317` local, `otel-collector:4317` Docker) |
| **Loki out of disk** | Prometheus scrapes fail, Loki DOWN | Increase Docker disk or reduce `retention_period` in `loki/loki-config.yml` |
| **React traces not appearing** | Tempo has no web-app traces | 1. Check VITE_OTEL_EXPORTER_OTLP_ENDPOINT in `.env` 2. Ensure React open in browser 3. Check browser console for CORS errors |

**More help:** [docs/SETUP.md#troubleshooting](docs/SETUP.md#troubleshooting)

---

## Documentation

- **[SETUP.md](docs/SETUP.md)** — Installation, configuration, production checklist
- **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** — Components, data flows, scaling
- **[DASHBOARDS.md](docs/DASHBOARDS.md)** — Grafana customization, JSON models

---

## Ports Reference

| Service | Host Port | Internal | Protocol | Notes |
|---------|-----------|----------|----------|-------|
| Grafana | 3000 | grafana:3000 | HTTP | UI |
| NestJS example | 3001 | nestjs-example:3001 | HTTP | Profile `examples` |
| Loki | 3100 | loki:3100 | HTTP | Log API |
| Tempo | 3200 | tempo:3200 | HTTP | Query API |
| OTel (gRPC) | 4317 | otel-collector:4317 | gRPC | Backend traces |
| OTel (HTTP) | 4318 | otel-collector:4318 | HTTP | Browser traces (CORS enabled) |
| Prometheus | 9090 | prometheus:9090 | HTTP | UI + scrape |
| Alertmanager | **127.0.0.1**:9093 | alertmanager:9093 | HTTP | Local only; use `http://` |
| Pushgateway | 9091 | pushgateway:9091 | HTTP | Browser metrics |
| node-exporter | — | node-exporter:9100 | — | Internal only (no host bind) |
| React (Vite) | 5173 | — | HTTP | `npm run dev` (host process) |

---

## Configuration

| Task | File | Key Setting |
|------|------|-------------|
| Log retention | `loki/loki-config.yml` | `limits_config.retention_period` (default: 72h) |
| Scrape targets | `prometheus/prometheus.yml` | `scrape_configs[]` |
| Alert rules | `prometheus/alerting-rules.yml` | Rule groups and thresholds |
| Alert routes | `alertmanager/config.yml` | Routes, receivers, matchers |
| Trace storage | `tempo/tempo.yaml` | Backend, retention |
| OTLP pipelines | `otel-collector/config.yaml` | Receivers, processors, exporters |
| Datasources | `grafana/provisioning/datasources/` | Loki, Prometheus, Tempo links |
| Dashboards | `grafana/provisioning/dashboards/` | Dashboard JSON files |

---

## Next Steps

1. ✅ **Start the stack:** `docker compose --profile examples up -d --build`
2. 📊 **View dashboards:** http://localhost:3000 (admin/admin)
3. 🧪 **Test observability:** `./scripts/verify.sh` and `curl http://localhost:3001/api/test`
4. 📖 **Read architecture:** [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
5. ⚙️ **Customize:** [docs/DASHBOARDS.md](docs/DASHBOARDS.md) for your metrics

---

## License

[MIT](LICENSE) © 2025 Faharid Manjarrez

---

**Questions?** Open an [issue](https://github.com/faharid/loka/issues) or check [SETUP.md](docs/SETUP.md).
