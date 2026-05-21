# observability-stack

> Spin up complete observability in minutes. Logs, metrics, traces, dashboards. Docker Compose + Grafana + Loki + Prometheus + Tempo.

## Overview

Production-style monitoring for local development and small deployments—without managed-service complexity.

| Pillar | Stack |
|--------|--------|
| **Logs** | Loki + Promtail + Pino (`pino-loki`) |
| **Metrics** | Prometheus + Pushgateway (browser RUM) |
| **Traces** | Grafana Tempo + OpenTelemetry Collector |
| **Dashboards** | Grafana (5 pre-built dashboards) |
| **Alerts** | Prometheus rules + Alertmanager |
| **Examples** | NestJS API + React RUM/tracing |

## Quick Start

```bash
git clone https://github.com/faharid/observe
cd observe

# Full stack + NestJS demo API
docker compose --profile examples up -d --build
```

Wait ~60 seconds, then open:

| Service | URL | Credentials |
|---------|-----|-------------|
| **Grafana** | http://localhost:3000 | `admin` / `admin` |
| **Prometheus** | http://localhost:9090/targets | — |
| **Alertmanager** | http://127.0.0.1:9093/#/alerts | — |
| **Pushgateway** | http://localhost:9091 | — |

Core stack only (without NestJS container):

```bash
docker compose up -d
```

📖 Full guide: **[docs/SETUP.md](docs/SETUP.md)**

## Architecture

```
Applications (NestJS, React)
    → Logs:    Pino / Promtail → Loki
    → Metrics: /metrics scrape + Pushgateway → Prometheus
    → Traces:  OTLP → OTel Collector → Tempo
                        ↓
              Grafana (dashboards + explore)
                        ↓
              Alertmanager (notifications)
```

Details: **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)**

## Project layout

```
observe/
├── docker-compose.yml       # Stack + profile "examples"
├── docs/
│   ├── SETUP.md             # Install, verify, troubleshoot
│   ├── ARCHITECTURE.md      # Components, ports, data flows
│   └── DASHBOARDS.md        # Grafana customization
├── backend-integration/nestjs-example/
├── frontend-integration/react-example/
├── grafana/                 # Dashboards + provisioning
├── prometheus/              # Scrape config + alert rules
├── alertmanager/
├── loki/  promtail/  tempo/  otel-collector/
├── scripts/verify.sh
└── .env.example
```

## Examples

### NestJS (Docker)

Included with `--profile examples`. Endpoints:

- `GET /api/health` — health check
- `GET /api/test` — normal request + DB spans
- `GET /api/slow` — slow query simulation
- `GET /api/error` — 500 for alert testing
- `GET /metrics` — Prometheus scrape

### NestJS (local)

```bash
cd backend-integration/nestjs-example
npm install
LOKI_URL=http://localhost:3100 \
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317 \
npm run start:dev
```

### React

```bash
cd frontend-integration/react-example
cp .env.example .env && npm install && npm run dev
# http://localhost:5173
```

## Grafana dashboards

| Dashboard | Content |
|-----------|---------|
| System | CPU, memory, disk, network |
| Application | RPS, latency P50/P95/P99, errors, Loki logs |
| Database | Query duration, pool, slow queries |
| Traces | Tempo search, error traces |
| Custom | Template for your metrics |

Guide: **[docs/DASHBOARDS.md](docs/DASHBOARDS.md)**

## Alerts

Rules in `prometheus/alerting-rules.yml`:

- Error rate > 1% (warning), > 5% (critical)
- P99 latency > 1s
- `nestjs-example` down
- Host memory > 80%

View: http://localhost:9090/alerts and http://127.0.0.1:9093/#/alerts

**Slack:** edit `alertmanager/config.yml` with a real `https://hooks.slack.com/...` URL (see commented example in file). Default config uses a no-op receiver for local dev.

## Configuration

| Task | File |
|------|------|
| Log retention (default 72h) | `loki/loki-config.yml` |
| Scrape targets / intervals | `prometheus/prometheus.yml` |
| Alert thresholds | `prometheus/alerting-rules.yml` |
| Notification routes | `alertmanager/config.yml` |
| Trace/log correlation | `grafana/provisioning/datasources/datasources.yml` |
| Datadog forward (optional) | Uncomment `remote_write` in `prometheus/prometheus.yml` |

## Ports reference

| Service | Host port | Notes |
|---------|-----------|-------|
| Grafana | 3000 | UI |
| NestJS example | 3001 | Profile `examples` |
| Loki | 3100 | API |
| Tempo | 3200 | Query API |
| OTel gRPC / HTTP | 4317 / 4318 | App instrumentation |
| Prometheus | 9090 | UI + scrape |
| Alertmanager | **127.0.0.1:9093** | UI; use http not https |
| Pushgateway | 9091 | Browser metrics |
| node-exporter | *(internal)* | No host bind (avoids :9100 conflicts) |
| React (Vite) | 5173 | Local `npm run dev` |

## Troubleshooting (quick)

| Issue | Fix |
|-------|-----|
| Alertmanager URL fails | `docker compose up -d alertmanager --force-recreate` → http://127.0.0.1:9093 |
| `nestjs-example` DOWN | `docker compose --profile examples up -d --build` |
| Port 9100 in use | Expected — node-exporter is internal-only |
| Empty dashboards | `curl http://localhost:3001/api/test` then wait 30s |

More: **[docs/SETUP.md#troubleshooting](docs/SETUP.md#troubleshooting)**

## Verify installation

```bash
./scripts/verify.sh
```

## Documentation

- [Setup guide](docs/SETUP.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Dashboards](docs/DASHBOARDS.md)

## License

MIT — see [LICENSE](LICENSE)
