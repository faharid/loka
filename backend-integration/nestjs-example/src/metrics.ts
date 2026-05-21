import { Counter, Gauge, Histogram, Registry, collectDefaultMetrics } from 'prom-client';

export const register = new Registry();

collectDefaultMetrics({ register, prefix: 'nodejs_' });

export const httpRequests = new Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status', 'service'],
  registers: [register],
});

export const requestDuration = new Histogram({
  name: 'http_request_duration_ms',
  help: 'HTTP request latency in milliseconds',
  labelNames: ['method', 'route', 'service'],
  buckets: [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000],
  registers: [register],
});

export const dbQueryDuration = new Histogram({
  name: 'db_query_duration_ms',
  help: 'Database query duration in milliseconds',
  labelNames: ['operation', 'service'],
  buckets: [1, 5, 10, 25, 50, 100, 250, 500, 1000],
  registers: [register],
});

export const dbSlowQueries = new Counter({
  name: 'db_slow_queries_total',
  help: 'Queries slower than 100ms',
  labelNames: ['operation', 'service'],
  registers: [register],
});

export const dbPoolActive = new Gauge({
  name: 'db_connection_pool_active',
  help: 'Active DB connections in pool',
  registers: [register],
});

export const dbPoolIdle = new Gauge({
  name: 'db_connection_pool_idle',
  help: 'Idle DB connections in pool',
  registers: [register],
});

export const serviceName = process.env.OTEL_SERVICE_NAME ?? 'nestjs-app';
