import { randomBytes } from 'crypto';

// This is the default, but you really should overwrite this
export function randomStringGenerator(len: number = 24) {
  return randomBytes(len / 2).toString('hex');
}
