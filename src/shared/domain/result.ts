export class Result<T> {
  private constructor(
    private readonly isSuccess: boolean,
    private readonly error?: string,
    private readonly value?: T
  ) {}

  public static ok<U>(value?: U): Result<U> {
    return new Result<U>(true, undefined, value);
  }

  public static fail<U>(error: string): Result<U> {
    return new Result<U>(false, error);
  }

  public isOk(): boolean {
    return this.isSuccess;
  }

  public isFail(): boolean {
    return !this.isSuccess;
  }

  public getValue(): T {
    if (!this.isSuccess) {
      throw new Error('Cannot get value of a failed result');
    }
    return this.value as T;
  }

  public getError(): string {
    if (this.isSuccess) {
      throw new Error('Cannot get error of a successful result');
    }
    return this.error as string;
  }
}