import asyncHandler from "../middlewares/asyncHandler.js";
import { createUser, validateUser, getUserById, updateUserProfile, changeUserPassword } from "../models/userModel.js";
import { signJwt } from "../utils/jwt.js";

// POST /api/users/register
export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body ?? {};
  if (!name || !email || !password) {
    res.status(400);
    throw new Error("name, email and password are required");
  }
  const user = await createUser({ name, email, password, phone });
  const token = signJwt({ id: user.id, email: user.email, name: user.name, isAdmin: user.isAdmin });
  res.status(201).json({ token, user });
});

 // POST /api/users/login
export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) {
    res.status(400);
    throw new Error("email and password are required");
  }
  const user = await validateUser(email, password);
  if (!user) {
    res.status(401);
    throw new Error("Invalid credentials");
  }
  const token = signJwt({ id: user.id, email: user.email, name: user.name, isAdmin: user.isAdmin });
  res.json({ token, user });
});

// GET /api/users/me
export const getMe = asyncHandler(async (req, res) => {
  const id = req.user?.id;
  if (!id) {
    res.status(401);
    throw new Error("Unauthorized");
  }
  const byId = await getUserById(id);
  if (byId) {
    return res.json({
      id: byId.id,
      name: byId.name,
      email: byId.email,
      isAdmin: byId.isAdmin,
      createdAt: byId.createdAt,
      updatedAt: byId.updatedAt,
    });
  }
  // fallback to token payload
  return res.json({
    id: req.user.id,
    name: req.user.name,
    email: req.user.email,
    isAdmin: req.user.isAdmin,
  });
});

// POST /api/users/logout
export const logoutUser = asyncHandler(async (req, res) => {
  // Stateless JWT logout: client should discard token. Endpoint provided for symmetry/auditing.
  res.json({ message: "Logged out" });
});

// PUT /api/users/me
export const updateMe = asyncHandler(async (req, res) => {
  const id = req.user?.id;
  if (!id) {
    res.status(401);
    throw new Error("Unauthorized");
  }
  const { name, phone } = req.body ?? {};
  if ((name === undefined || String(name).trim() === "") && phone === undefined) {
    res.status(400);
    throw new Error("Provide name and/or phone to update");
  }
  const updated = await updateUserProfile(id, { name, phone });
  res.json(updated);
});

// PUT /api/users/change-password
export const changePassword = asyncHandler(async (req, res) => {
  const id = req.user?.id;
  if (!id) {
    res.status(401);
    throw new Error("Unauthorized");
  }
  const { currentPassword, newPassword } = req.body ?? {};
  if (!currentPassword || !newPassword) {
    res.status(400);
    throw new Error("currentPassword and newPassword are required");
  }
  if (String(newPassword).length < 6) {
    res.status(400);
    throw new Error("newPassword must be at least 6 characters");
  }
  const result = await changeUserPassword(id, currentPassword, newPassword);
  if (!result.ok) {
    if (result.reason === "INVALID_CURRENT") {
      res.status(400);
      throw new Error("Current password is incorrect");
    }
    res.status(404);
    throw new Error("User not found");
  }
  res.json({ message: "Password updated successfully" });
});
