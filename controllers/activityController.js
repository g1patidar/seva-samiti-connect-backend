import path from "path";
import fs from "fs";
import multer from "multer";
import { fileURLToPath } from "url";
import { createActivity, listActivities as listActivitiesModel, deleteActivity as deleteActivityModel } from "../models/activityModel.js";
import asyncHandler from "../middlewares/asyncHandler.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads dir exists
const activitiesDir = path.join(__dirname, "..", "public", "uploads", "activities");
fs.mkdirSync(activitiesDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, activitiesDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/[^a-z0-9_-]/gi, "_").toLowerCase();
    const name = `${base}_${Date.now()}${ext}`;
    cb(null, name);
  },
});

const allowed = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "video/mp4",
  "video/webm",
  "video/ogg",
];
function fileFilter(_req, file, cb) {
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Only images and mp4/webm/ogg videos are allowed"));
}

export const upload = multer({ storage, fileFilter });

export const createActivityHandler = [
  upload.single("media"),
  asyncHandler(async (req, res) => {
    const { title, description, isPublic, eventDate } = req.body;
    let mediaUrl = "";
    let mediaType = "";

    if (req.file) {
      const rel = path
        .join("/uploads/activities", req.file.filename)
        .replace(/\\/g, "/");
      mediaUrl = rel;
      mediaType = req.file.mimetype.startsWith("image/") ? "image" : "video";
    }

    const activity = await createActivity({
      title,
      description,
      mediaUrl,
      mediaType,
      isPublic: isPublic !== undefined ? isPublic === "true" || isPublic === true : true,
      createdBy: req.user?.id,
      eventDate: eventDate || undefined,
    });

    res.status(201).json(activity);
  }),
];

export const listActivities = asyncHandler(async (req, res) => {
  const limit = req.query.limit ? Number(req.query.limit) : 50;
  const publicOnly =
    req.query.publicOnly !== undefined
      ? req.query.publicOnly === "true" || req.query.publicOnly === true
      : true;

  // If requesting non-public list, ensure admin
  if (!publicOnly) {
    if (!req.user || !req.user.isAdmin) {
      res.status(403);
      throw new Error("Forbidden");
    }
  }

  const items = await listActivitiesModel({ limit, publicOnly });
  res.json(items);
});

export const deleteActivity = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const removed = await deleteActivityModel(id);
  if (!removed) {
    res.status(404);
    throw new Error("Activity not found");
  }
  // Try to remove file if exists
  if (removed.mediaUrl) {
    const safeRel = removed.mediaUrl.replace(/^\/+/, "");
    const abs = path.join(__dirname, "..", "public", safeRel);
    fs.unlink(abs, () => {});
  }
  res.json({ ok: true, id: removed.id });
});
