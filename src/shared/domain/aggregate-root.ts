export abstract class AggregateRoot {
  private domainEvents: any[] = [];

  protected addDomainEvent(event: any): void {
    this.domainEvents.push(event);
  }

  public pullDomainEvents(): any[] {
    const events = [...this.domainEvents];
    this.clearDomainEvents();
    return events;
  }

  private clearDomainEvents(): void {
    this.domainEvents = [];
  }
}