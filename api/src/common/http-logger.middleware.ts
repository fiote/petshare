import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

@Injectable()
export class HttpLoggerMiddleware implements NestMiddleware {
	private readonly logger = new Logger('HTTP');

	use(req: Request, res: Response, next: NextFunction): void {
		const start = Date.now();

		res.on('finish', () => {
			const durationMs = Date.now() - start;
			const message = `${req.method} ${req.originalUrl} ${res.statusCode} ${durationMs}ms`;

			if (res.statusCode >= 500) {
				this.logger.error(message);
			} else if (res.statusCode >= 400) {
				this.logger.warn(message);
			} else {
				this.logger.log(message);
			}
		});

		next();
	}
}
