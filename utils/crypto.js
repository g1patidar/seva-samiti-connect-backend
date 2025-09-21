import crypto from "crypto";

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const iterations = 100000;
  const keylen = 64;
  const digest = "sha512";
  const hash = crypto.pbkdf2Sync(password, salt, iterations, keylen, digest).toString("hex");
  return `${salt}:${iterations}:${digest}:${hash}`;
}

export function verifyPassword(password, stored) {
  if (!stored || typeof stored !== "string") return false;
  const [salt, itersStr, digest, originalHash] = stored.split(":");
  const iterations = parseInt(itersStr, 10) || 100000;
  const keylen = 64;
  const computed = crypto.pbkdf2Sync(password, salt, iterations, keylen, digest || "sha512").toString("hex");
  return crypto.timingSafeEqual(Buffer.from(originalHash, "hex"), Buffer.from(computed, "hex"));
}
