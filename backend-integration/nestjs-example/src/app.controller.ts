import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';
import { runQuery } from './database.mock';
import { logger } from './logger';

@Controller('api')
export class AppController {
  @Get('health')
  health() {
    return { status: 'ok', service: 'nestjs-app' };
  }

  @Get('test')
  async test() {
    logger.info({ endpoint: '/api/test' }, 'Test endpoint called');
    await runQuery('findUser', 30);
    await runQuery('listOrders', 45);
    return { message: 'ok', timestamp: new Date().toISOString() };
  }

  @Get('slow')
  async slow() {
    logger.warn({ endpoint: '/api/slow' }, 'Slow endpoint called');
    await runQuery('heavyReport', 350);
    return { message: 'slow response' };
  }

  @Get('error')
  error() {
    logger.error({ endpoint: '/api/error' }, 'Simulated server error');
    throw new HttpException('Simulated error', HttpStatus.INTERNAL_SERVER_ERROR);
  }
}
