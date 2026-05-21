import { trace, SpanStatusCode } from '@opentelemetry/api';
import {
  dbPoolActive,
  dbPoolIdle,
  dbQueryDuration,
  dbSlowQueries,
  serviceName,
} from './metrics';
import { logger } from './logger';

const tracer = trace.getTracer('database-mock');

export async function runQuery(operation: string, delayMs = 20): Promise<string> {
  return tracer.startActiveSpan(`db.${operation}`, async (span) => {
    span.setAttribute('db.operation', operation);
    const start = Date.now();

    dbPoolActive.inc();
    dbPoolIdle.dec();

    await new Promise((resolve) => setTimeout(resolve, delayMs));

    const duration = Date.now() - start;
    dbQueryDuration.observe({ operation, service: serviceName }, duration);

    if (duration > 100) {
      dbSlowQueries.inc({ operation, service: serviceName });
      logger.warn({ operation, duration }, 'Slow query detected');
    }

    dbPoolActive.dec();
    dbPoolIdle.inc();

    span.setAttribute('db.duration_ms', duration);
    span.setStatus({ code: SpanStatusCode.OK });
    span.end();

    return `ok:${operation}`;
  });
}

export function initPoolMetrics(): void {
  dbPoolIdle.set(10);
  dbPoolActive.set(0);
}
