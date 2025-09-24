import asyncHandler from "../middlewares/asyncHandler.js";
import {
  createAnnouncement,
  listAnnouncements as listAnnouncementsModel,
  deleteAnnouncement as deleteAnnouncementModel,
} from "../models/announcementModel.js";

/**
 * POST /api/announcements
 * Admin-only: create an announcement
 * Body: { title: string, message?: string, isPublic?: boolean, eventDate?: string|Date }
 */
export const createAnnouncementHandler = asyncHandler(async (req, res) => {
  const { title, message, isPublic, eventDate } = req.body;
  if (!title || !String(title).trim()) {
    res.status(400);
    throw new Error("title is required");
  }
  const announcement = await createAnnouncement({
    title,
    message,
    isPublic: isPublic !== undefined ? isPublic === true || isPublic === "true" : true,
    eventDate: eventDate || undefined,
    createdBy: req.user?.id,
  });
  res.status(201).json(announcement);
});

/**
 * GET /api/announcements?limit=&publicOnly=
 * Public endpoint to list announcements
 */
export const listAnnouncements = asyncHandler(async (req, res) => {
  const limit = req.query.limit ? Number(req.query.limit) : 50;
  const publicOnly =
    req.query.publicOnly !== undefined
      ? req.query.publicOnly === "true" || req.query.publicOnly === true
      : true;
  const items = await listAnnouncementsModel({ limit, publicOnly });
  res.json(items);
});

/**
 * DELETE /api/announcements/:id
 * Admin-only: delete an announcement
 */
export const deleteAnnouncement = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const removed = await deleteAnnouncementModel(id);
  if (!removed) {
    res.status(404);
    throw new Error("Announcement not found");
  }
  res.json({ ok: true, id: removed.id });
});
