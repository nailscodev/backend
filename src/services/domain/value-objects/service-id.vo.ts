import { randomUUID } from 'crypto';

export class ServiceId {
  private constructor(private readonly _value: string) {}

  static create(): ServiceId {
    return new ServiceId(randomUUID());
  }

  static fromString(value: string): ServiceId {
    return new ServiceId(value);
  }

  get value(): string {
    return this._value;
  }

  equals(id: ServiceId): boolean {
    return this._value === id._value;
  }

  toString(): string {
    return this._value;
  }
}