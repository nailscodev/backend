import { randomUUID } from 'crypto';

export class StaffId {
  private constructor(private readonly _value: string) {}

  static create(): StaffId {
    return new StaffId(randomUUID());
  }

  static fromString(value: string): StaffId {
    return new StaffId(value);
  }

  get value(): string {
    return this._value;
  }

  equals(id: StaffId): boolean {
    return this._value === id._value;
  }

  toString(): string {
    return this._value;
  }
}