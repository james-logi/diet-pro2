import bcrypt from "bcryptjs";

// bcryptjs falls back to Math.random() for salt generation unless given a
// secure source. Cloudflare Workers expose Web Crypto, so wire that in.
bcrypt.setRandomFallback((len: number) => {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  return Array.from(bytes);
});

const SALT_ROUNDS = 10;

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, SALT_ROUNDS);
}

export function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}
