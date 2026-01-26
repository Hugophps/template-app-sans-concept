export class SupabaseError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = 'SupabaseError';
  }
}

export class SupabaseAuthError extends SupabaseError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
    this.name = 'SupabaseAuthError';
  }
}

export class SupabaseQueryError extends SupabaseError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
    this.name = 'SupabaseQueryError';
  }
}
