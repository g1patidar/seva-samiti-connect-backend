import express from "express";
import { requireAuth, requireAdmin, optionalAuth } from "../middlewares/auth.js";
import {
  listAnnouncements,
  createAnnouncementHandler,
  deleteAnnouncement,
} from "../controllers/announcementController.js";

const router = express.Router();

// Public: list announcements
router.get("/", optionalAuth, listAnnouncements);

// Admin: create announcement
router.post("/", requireAuth, requireAdmin, createAnnouncementHandler);

// Admin: delete announcement
router.delete("/:id", requireAuth, requireAdmin, deleteAnnouncement);

export default router;
