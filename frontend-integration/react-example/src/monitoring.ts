import { onCLS, onINP, onLCP, type Metric } from 'web-vitals';

export interface MonitoringConfig {
  pushgatewayUrl?: string;
  serviceName?: string;
}

let config: Required<MonitoringConfig> = {
  pushgatewayUrl: 'http://localhost:9091',
  serviceName: 'web-app',
};

const customEvents: Record<string, number> = {};

function formatPrometheusLine(
  name: string,
  value: number,
  labels: Record<string, string>,
): string {
  const labelStr = Object.entries(labels)
    .map(([k, v]) => `${k}="${v.replace(/"/g, '\\"')}"`)
    .join(',');
  return `${name}{${labelStr}} ${value}`;
}

async function pushMetrics(body: string): Promise<void> {
  const url = `${config.pushgatewayUrl}/metrics/job/${config.serviceName}`;
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body,
  });
}

function recordVital(metric: Metric): void {
  const name = `web_vital_${metric.name.toLowerCase()}`;
  const lines = [
    formatPrometheusLine(name, metric.value, {
      service: config.serviceName,
      rating: metric.rating,
    }),
    `# TYPE ${name} gauge`,
  ];
  void pushMetrics(lines.join('\n') + '\n');
}

export function initMonitoring(userConfig?: MonitoringConfig): void {
  config = { ...config, ...userConfig };

  onLCP(recordVital);
  onINP(recordVital);
  onCLS(recordVital);

  window.addEventListener('error', (event) => {
    const lines = [
      formatPrometheusLine('browser_errors_total', 1, {
        service: config.serviceName,
        message: event.message?.slice(0, 80) ?? 'unknown',
      }),
    ];
    void pushMetrics(lines.join('\n') + '\n');
  });
}

export function trackEvent(name: string, labels: Record<string, string> = {}): void {
  const key = `${name}:${JSON.stringify(labels)}`;
  customEvents[key] = (customEvents[key] ?? 0) + 1;

  const lines = Object.entries(customEvents).map(([k, count]) => {
    const [eventName, labelJson] = k.split(':');
    const parsed = JSON.parse(labelJson || '{}') as Record<string, string>;
    return formatPrometheusLine('browser_events_total', count, {
      service: config.serviceName,
      event: eventName,
      ...parsed,
      ...labels,
    });
  });

  void pushMetrics(lines.join('\n') + '\n');
}

export async function trackPageView(path: string): Promise<void> {
  const lines = [
    formatPrometheusLine('browser_page_views_total', 1, {
      service: config.serviceName,
      path,
    }),
  ];
  await pushMetrics(lines.join('\n') + '\n');
}
