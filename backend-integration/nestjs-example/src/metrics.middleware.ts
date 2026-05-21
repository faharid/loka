import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { httpRequests, requestDuration, serviceName } from './metrics';

@Injectable()
export class MetricsMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const start = Date.now();
    const route = req.route?.path ?? req.path ?? 'unknown';

    res.on('finish', () => {
      const duration = Date.now() - start;
      const labels = {
        method: req.method,
        route,
        status: String(res.statusCode),
        service: serviceName,
      };

      httpRequests.inc(labels);
      requestDuration.observe(
        { method: req.method, route, service: serviceName },
        duration,
      );
    });

    next();
  }
}
