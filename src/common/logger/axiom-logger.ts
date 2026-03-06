import { LoggerService } from '@nestjs/common';
import * as winston from 'winston';
import { WinstonTransport as AxiomTransport } from '@axiomhq/winston';

const isProduction = process.env.NODE_ENV === 'production';
const axiomToken   = process.env.AXIOM_TOKEN;
const axiomDataset = process.env.AXIOM_DATASET || 'nailsco-logs';

const transports: winston.transport[] = [
  new winston.transports.Console({
    format: isProduction
      ? winston.format.combine(winston.format.timestamp(), winston.format.json())
      : winston.format.combine(
          winston.format.colorize(),
          winston.format.timestamp({ format: 'HH:mm:ss' }),
          winston.format.printf(({ level, message, timestamp, context, ...meta }) => {
            const ctx = context ? ` [${context}]` : '';
            const extra = Object.keys(meta).length ? ' ' + JSON.stringify(meta) : '';
            return `${timestamp} ${level}${ctx}: ${message}${extra}`;
          }),
        ),
  }),
];

// Ship to Axiom only in production when the token is available
if (isProduction && axiomToken) {
  transports.push(
    new AxiomTransport({
      token:   axiomToken,
      dataset: axiomDataset,
    }),
  );
}

const winstonLogger = winston.createLogger({
  level: isProduction ? 'info' : 'debug',
  defaultMeta: { app: 'nailsco-backend', env: process.env.NODE_ENV },
  transports,
});

/**
 * NestJS-compatible logger backed by Winston + Axiom (in production).
 * Use as the app-wide logger: app.useLogger(new AxiomLogger())
 */
export class AxiomLogger implements LoggerService {
  log(message: string, context?: string) {
    winstonLogger.info(message, { context });
  }
  error(message: string, trace?: string, context?: string) {
    winstonLogger.error(message, { trace, context });
  }
  warn(message: string, context?: string) {
    winstonLogger.warn(message, { context });
  }
  debug(message: string, context?: string) {
    winstonLogger.debug(message, { context });
  }
  verbose(message: string, context?: string) {
    winstonLogger.verbose(message, { context });
  }
}

/** Raw winston instance — use for structured log events (e.g. booking created) */
export { winstonLogger as logger };
