// lib/token.ts
import crypto from "crypto";

export function generateTokenPlain(length = 32) {
  return crypto.randomBytes(length).toString("hex"); // plaintext token to send
}

export function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}
