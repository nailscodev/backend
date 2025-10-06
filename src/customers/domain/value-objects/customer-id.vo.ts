import { randomUUID } from 'crypto';

export class CustomerId {
  private constructor(private readonly _value: string) {}

  static create(): CustomerId {
    return new CustomerId(randomUUID());
  }

  static fromString(value: string): CustomerId {
    return new CustomerId(value);
  }

  get value(): string {
    return this._value;
  }

  equals(id: CustomerId): boolean {
    return this._value === id._value;
  }

  toString(): string {
    return this._value;
  }
}