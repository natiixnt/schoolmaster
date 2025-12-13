import { customAlphabet } from 'nanoid';

/**
 * Generates a unique referral code in the format E8-XXXXX
 * Where XXXXX is a 5-character alphanumeric string (uppercase letters and numbers)
 * Example: E8-A1B2C, E8-XY9Z4
 */
export function generateReferralCode(): string {
  // Use only uppercase letters and numbers for the code
  const nanoid = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 5);
  return `E8-${nanoid()}`;
}
