import asyncHandler from "./asyncHandler.js";
import { verifyJwt } from "../utils/jwt.js";

function getTokenFromHeader(req) {
  const auth = req.headers.authorization || req.headers.Authorization;
  if (!auth || typeof auth !== "string") return null;
  const [scheme, token] = auth.split(" ");
  if (scheme !== "Bearer" || !token) return null;
  return token;
}

export const optionalAuth = asyncHandler(async (req, res, next) => {
  const token = getTokenFromHeader(req);
  console.log("kfdhks")
  if (token) {
    try {
      req.user = verifyJwt(token);
    } catch {
      // ignore invalid token for optional auth
    }
  }
  next();
});

export const requireAuth = asyncHandler(async (req, res, next) => {
  const token = getTokenFromHeader(req);
  if (!token) {
    res.status(401);
    throw new Error("Unauthorized: missing token");
  }
  try {
    req.user = verifyJwt(token);
  } catch (e) {
    res.status(401);
    throw new Error("Unauthorized: invalid or expired token");
  }
  next();
});

// Ensure a route param matches the authenticated user's field
// Example: authorizeSelfByParam("userId", "id") or authorizeSelfByParam("email", "email")
export const authorizeSelfByParam = (paramName, userField) =>
  asyncHandler(async (req, res, next) => {
    if (!req.user) {
      res.status(401);
      throw new Error("Unauthorized");
    }
    const paramVal = req.params?.[paramName];
    const userVal = req.user?.[userField];
    if (paramVal === undefined || userVal === undefined) {
      res.status(400);
      throw new Error("Bad Request: missing param or user field");
    }
    if (String(paramVal) !== String(userVal)) {
      res.status(403);
      throw new Error("Forbidden");
    }
    next();
  });

export const requireAdmin = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    res.status(401);
    throw new Error("Unauthorized");
  }
  if (!req.user.isAdmin) {
    res.status(403);
    throw new Error("Forbidden: admin only");
  }
  next();
});
