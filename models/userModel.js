import mongoose from "mongoose";
import { hashPassword, verifyPassword } from "../utils/crypto.js";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    passwordHash: { type: String, required: true },
    isAdmin: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const UserModel = mongoose.models.User || mongoose.model("User", userSchema);

function toSafeUser(doc) {
  if (!doc) return null;
  const obj = typeof doc.toObject === "function" ? doc.toObject() : doc;
  return {
    id: String(obj._id),
    name: obj.name,
    email: obj.email,
    phone: obj.phone || "",
    isAdmin: Boolean(obj.isAdmin),
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
  };
}

export async function getAllUsers() {
  const users = await UserModel.find({}).lean();
  return users.map(toSafeUser);
}

export async function findUserByEmail(email) {
  // Internal use: return the full doc (LEAN) including passwordHash
  return await UserModel.findOne({ email: String(email).toLowerCase().trim() }).lean();
}

export async function getUserById(id) {
  const user = await UserModel.findById(id).lean();
  return toSafeUser(user);
}

export async function createUser({ name, email, password, phone }) {
  if (!name || !email || !password) {
    throw new Error("name, email, and password are required");
  }

  const existing = await UserModel.findOne({ email: String(email).toLowerCase().trim() }).lean();
  if (existing) {
    const err = new Error("User already exists");
    err.code = "USER_EXISTS";
    throw err;
  }

  const nowHash = hashPassword(password);
  const doc = await UserModel.create({
    name,
    email: String(email).toLowerCase().trim(),
    phone: phone || "",
    passwordHash: nowHash,
  });

  return toSafeUser(doc);
}

export async function validateUser(email, password) {
  const user = await UserModel.findOne({ email: String(email).toLowerCase().trim() }).lean();
  if (!user) return null;
  const ok = verifyPassword(password, user.passwordHash);
  if (!ok) return null;
  return toSafeUser(user);
}

export async function updateUserProfile(id, { name, phone }) {
  const set = {};
  if (typeof name === "string" && name.trim()) set.name = name.trim();
  if (phone !== undefined) set.phone = phone || "";
  const updated = await UserModel.findByIdAndUpdate(id, { $set: set }, { new: true }).lean();
  return toSafeUser(updated);
}

export async function changeUserPassword(id, currentPassword, newPassword) {
  const doc = await UserModel.findById(id).lean();
  if (!doc) return { ok: false, reason: "NOT_FOUND" };
  const ok = verifyPassword(currentPassword, doc.passwordHash);
  if (!ok) return { ok: false, reason: "INVALID_CURRENT" };
  const newHash = hashPassword(newPassword);
  await UserModel.findByIdAndUpdate(id, { $set: { passwordHash: newHash } });
  return { ok: true };
}
