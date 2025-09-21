import crypto from "crypto";

function base64url(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64urlJson(obj) {
  return base64url(JSON.stringify(obj));
}

function hmacSHA256(data, secret) {
  return crypto.createHmac("sha256", secret).update(data).digest("base64url");
}

function getSecret() {
  return process.env.JWT_SECRET || "dev_secret_change_me";
}

export function signJwt(payload, { expiresInSec = 60 * 60 * 24 * 7 } = {}) {
  const header = { alg: "HS256", typ: "JWT" };
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + (Number(expiresInSec) || 0);

  const fullPayload = { ...payload, iat, exp };
  const encodedHeader = base64urlJson(header);
  const encodedPayload = base64urlJson(fullPayload);
  const data = `${encodedHeader}.${encodedPayload}`;
  const signature = hmacSHA256(data, getSecret());

  return `${data}.${signature}`;
}

export function verifyJwt(token) {
  if (!token || typeof token !== "string") {
    throw new Error("Invalid token");
  }
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid token format");
  }
  const [encodedHeader, encodedPayload, signature] = parts;
  const data = `${encodedHeader}.${encodedPayload}`;
  const expected = hmacSHA256(data, getSecret());
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    throw new Error("Invalid token signature");
  }
  const payloadJson = Buffer.from(encodedPayload.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
  const payload = JSON.parse(payloadJson);
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && now > payload.exp) {
    throw new Error("Token expired");
  }
  return payload;
}
