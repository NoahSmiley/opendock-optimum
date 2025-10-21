import { describe, expect, it } from 'vitest';
import { ensurePasswordMeetsPolicy, hashPassword, verifyPassword, PasswordValidationError } from './passwords';

describe('password policies', () => {
  it('enforces minimum length', () => {
    expect(() => ensurePasswordMeetsPolicy('shortPwd1A')).toThrow(PasswordValidationError);
  });

  it('requires uppercase, lowercase, number', () => {
    expect(() => ensurePasswordMeetsPolicy('alllowercase123')).toThrow(PasswordValidationError);
    expect(() => ensurePasswordMeetsPolicy('ALLUPPERCASE123')).toThrow(PasswordValidationError);
    expect(() => ensurePasswordMeetsPolicy('NoNumbersHere')).toThrow(PasswordValidationError);
  });

  it('accepts strong passwords', () => {
    expect(() => ensurePasswordMeetsPolicy('ValidPassword123')).not.toThrow();
  });
});

describe('hashPassword / verifyPassword', () => {
  it('hashes and verifies a password', async () => {
    const plain = 'CorrectHorseBatteryStaple1';
    const hashed = await hashPassword(plain);
    expect(hashed).not.toBe(plain);
    await expect(verifyPassword(plain, hashed)).resolves.toBe(true);
    await expect(verifyPassword('wrong', hashed)).resolves.toBe(false);
  });
});

