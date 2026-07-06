import { scrypt, randomBytes, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

/**
 * Hashes a plain text password using Node's native scrypt algorithm.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString('hex')}.${salt}`;
}

/**
 * Compares a plain text password against a stored scrypt hash.
 */
export async function comparePassword(password: string, storedHash: string): Promise<boolean> {
  const [hash, salt] = storedHash.split('.');
  if (!hash || !salt) {
    return false;
  }
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  const matchBuf = Buffer.from(hash, 'hex');
  return timingSafeEqual(matchBuf, buf);
}
