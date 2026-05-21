# Dashboards Guide

How to use, customize, and extend the pre-provisioned Grafana dashboards.

## Where dashboards live

| Path | Loaded by |
|------|-----------|
| `grafana/dashboards/*.json` | File provisioning |
| `grafana/provisioning/dashboards/dashboards.yml` | Provider config |
| `grafana/provisioning/datasources/datasources.yml` | Prometheus, Loki, Tempo |

On startup, Grafana mounts these into the **Observe** folder. Reload interval: **30 seconds**.

## Pre-built dashboards

| Dashboard | UID | Datasource(s) | Requires |
|-----------|-----|---------------|----------|
| System Dashboard | `observe-system` | Prometheus | `node-exporter` UP |
| Application Dashboard | `observe-app` | Prometheus, Loki | NestJS traffic + logs |
| Database Dashboard | `observe-database` | Prometheus | NestJS DB mock metrics |
| Traces Dashboard | `observe-traces` | Tempo | OTel traces ingested |
| Custom Dashboard (Template) | `observe-custom` | Prometheus | Any `http_requests_total` |

Open Grafana: **Dashboards → Observe**.

### When panels show "No data"

1. Check Prometheus targets: http://localhost:9090/targets
2. Generate traffic:
   ```bash
   curl http://localhost:3001/api/test
   ```
3. Wait 15–30s (scrape interval) and refresh the dashboard

## Application dashboard metrics

Panels expect these metric names from `backend-integration/nestjs-example/src/metrics.ts`:

| Metric | Type |
|--------|------|
| `http_requests_total` | Counter (`method`, `route`, `status`, `service`) |
| `http_request_duration_ms` | Histogram |
| `db_query_duration_ms` | Histogram |
| `db_connection_pool_active` / `_idle` | Gauge |
| `db_slow_queries_total` | Counter |

## Database dashboard

Uses the mock database layer in the NestJS example. When you add a real ORM (TypeORM, Prisma), export compatible metric names or update panel queries.

## Traces dashboard

- **Trace search** panel: TraceQL `{}` — all recent traces
- **Error traces**: `{ status = error }`

Explore end-to-end paths:

1. Run React example and click **Call /api/test**
2. Open **Explore → Tempo** or the Traces dashboard
3. Filter: `{ resource.service.name = "web-app" }`

## Trace-to-logs

Tempo datasource (`uid: tempo`) is wired to Loki (`uid: loki`) via `tracesToLogs`:

1. Open a trace in Grafana
2. Select a span
3. Use **Logs for this span** (or equivalent link)

Align labels in your apps:

| System | Label |
|--------|-------|
| OpenTelemetry | `service.name` |
| Loki (Pino) | `job`, `service` |

## Create a custom dashboard

1. **Dashboards → Observe → Custom Dashboard (Template)**
2. **⋮ → Save as** → new name
3. Add panels with PromQL, for example:

   ```promql
   sum(rate(http_requests_total{service="nestjs-app"}[5m])) by (route)
   ```

4. **Share → Export → Save to file**
5. Save JSON under `grafana/dashboards/my-dashboard.json`
6. Wait for provisioning reload (~30s) or restart Grafana:

   ```bash
   docker compose restart grafana
   ```

## Useful queries

### Prometheus (PromQL)

```promql
# Request rate
sum(rate(http_requests_total[1m]))

# Error percentage
(sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m]))) * 100

# P99 latency (ms)
histogram_quantile(0.99, sum(rate(http_request_duration_ms_bucket[5m])) by (le))

# Browser events (Pushgateway)
browser_events_total{job="web-app"}
```

### Loki (LogQL)

```logql
{job="nestjs-app"}
{job="nestjs-app"} |= "error"
{job="nestjs-app"} | json | level = "error"
```

### Tempo (TraceQL)

```traceql
{ resource.service.name = "nestjs-app" }
{ resource.service.name = "web-app" }
{ status = error }
```

## Variables

The custom template defines:

- **`$service`** — `label_values(http_requests_total, service)`

Add variables in **Dashboard settings → Variables** for `environment`, `route`, etc.

## Alerts and dashboards

Alert rules in `prometheus/alerting-rules.yml` are independent of dashboards. To visualize alert state:

- Prometheus: **Alerts** tab
- Alertmanager: http://127.0.0.1:9093/#/alerts
- Optional: add a Grafana panel with `ALERTS{alertstate="firing"}`

## Production tips

- Keep stable `uid` fields in JSON to avoid duplicate dashboards on reprovision
- Version-control dashboard JSON in Git
- Use separate Grafana folders per environment (`staging`, `production`)
- For large teams, consider [Grafana dashboard as code](https://grafana.com/docs/grafana/latest/administration/provisioning/) in CI

See also [SETUP.md](SETUP.md) and [ARCHITECTURE.md](ARCHITECTURE.md).
