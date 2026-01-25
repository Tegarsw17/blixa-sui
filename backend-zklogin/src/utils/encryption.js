import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

export function generateKey() {
  return crypto.randomBytes(KEY_LENGTH).toString('hex');
}

export function encryptFile(buffer, key) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const salt = crypto.randomBytes(SALT_LENGTH);
  
  const derivedKey = crypto.pbkdf2Sync(
    Buffer.from(key, 'hex'),
    salt,
    100000,
    KEY_LENGTH,
    'sha512'
  );

  const cipher = crypto.createCipheriv(ALGORITHM, derivedKey, iv);
  
  const encrypted = Buffer.concat([
    cipher.update(buffer),
    cipher.final()
  ]);
  
  const tag = cipher.getAuthTag();
  
  return Buffer.concat([salt, iv, tag, encrypted]);
}

export function decryptFile(encryptedBuffer, key) {
  const salt = encryptedBuffer.slice(0, SALT_LENGTH);
  const iv = encryptedBuffer.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const tag = encryptedBuffer.slice(
    SALT_LENGTH + IV_LENGTH,
    SALT_LENGTH + IV_LENGTH + TAG_LENGTH
  );
  const encrypted = encryptedBuffer.slice(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);

  const derivedKey = crypto.pbkdf2Sync(
    Buffer.from(key, 'hex'),
    salt,
    100000,
    KEY_LENGTH,
    'sha512'
  );

  const decipher = crypto.createDecipheriv(ALGORITHM, derivedKey, iv);
  decipher.setAuthTag(tag);

  return Buffer.concat([
    decipher.update(encrypted),
    decipher.final()
  ]);
}

export function hashFile(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}
