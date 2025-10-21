import bcrypt from "bcryptjs";

const DEFAULT_SALT_ROUNDS = Number(process.env.OPENDOCK_BCRYPT_ROUNDS ?? 12);

export class PasswordValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PasswordValidationError";
  }
}

export function ensurePasswordMeetsPolicy(password: string): void {
  if (password.length < 12) {
    throw new PasswordValidationError("Password must be at least 12 characters long.");
  }
  if (!/[A-Z]/.test(password)) {
    throw new PasswordValidationError("Password must include at least one uppercase letter.");
  }
  if (!/[a-z]/.test(password)) {
    throw new PasswordValidationError("Password must include at least one lowercase letter.");
  }
  if (!/[0-9]/.test(password)) {
    throw new PasswordValidationError("Password must include at least one number.");
  }
}

export async function hashPassword(password: string): Promise<string> {
  ensurePasswordMeetsPolicy(password);
  const rounds = Number.isFinite(DEFAULT_SALT_ROUNDS) ? DEFAULT_SALT_ROUNDS : 12;
  return bcrypt.hash(password, rounds);
}

export function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}

