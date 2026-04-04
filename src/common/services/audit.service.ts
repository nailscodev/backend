import { Injectable, Logger } from '@nestjs/common';

export interface AuditEvent {
  action: string;
  actorId: string | number;
  actorRole: string;
  resourceType: string;
  resourceId: string;
  metadata?: Record<string, unknown>;
}

/**
 * Emits structured audit log entries for sensitive mutations.
 * Entries are written via the NestJS Logger (console in dev, Axiom in prod).
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger('Audit');

  log(event: AuditEvent): void {
    this.logger.log(
      `${event.action} | actor=${event.actorId}(${event.actorRole}) | ${event.resourceType}:${event.resourceId}${event.metadata ? ' | ' + JSON.stringify(event.metadata) : ''}`,
    );
  }
}
