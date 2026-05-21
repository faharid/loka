#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> Checking config files..."
required=(
  docker-compose.yml
  loki/loki-config.yml
  promtail/promtail-config.yml
  prometheus/prometheus.yml
  prometheus/alerting-rules.yml
  alertmanager/config.yml
  tempo/tempo.yaml
  otel-collector/config.yaml
  grafana/provisioning/datasources/datasources.yml
  grafana/dashboards/system.json
)

for f in "${required[@]}"; do
  test -f "$f" || { echo "Missing: $f"; exit 1; }
done

echo "==> Building NestJS example..."
(cd backend-integration/nestjs-example && npm run build)

echo "==> Building React example..."
(cd frontend-integration/react-example && npm run build)

if docker info >/dev/null 2>&1; then
  echo "==> Starting Docker stack..."
  docker compose up -d
  sleep 15
  curl -sf http://localhost:3100/ready
  curl -sf http://localhost:9090/-/healthy
  curl -sf http://localhost:3200/ready
  echo "Docker stack healthy."
else
  echo "Docker not running — skipped container verification."
fi

echo "All checks passed."
