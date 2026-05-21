import pino from 'pino';

const lokiHost = process.env.LOKI_URL ?? 'http://localhost:3100';
const isDev = process.env.NODE_ENV !== 'production';

const targets: pino.TransportTargetOptions[] = [
  {
    target: 'pino/file',
    options: { destination: 1 },
    level: 'info',
  },
];

if (process.env.ENABLE_LOKI !== 'false') {
  targets.push({
    target: 'pino-loki',
    options: {
      host: lokiHost,
      labels: {
        job: 'nestjs-app',
        service: process.env.OTEL_SERVICE_NAME ?? 'nestjs-app',
        environment: process.env.NODE_ENV ?? 'development',
      },
      batching: true,
      interval: 5,
    },
    level: 'info',
  });
}

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  transport: isDev
    ? {
        targets,
      }
    : undefined,
});

export function getPinoHttpOptions() {
  return {
    logger,
    customProps: () => ({
      service: process.env.OTEL_SERVICE_NAME ?? 'nestjs-app',
    }),
  };
}
