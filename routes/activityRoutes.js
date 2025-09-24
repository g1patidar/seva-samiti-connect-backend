import express from "express";
import { requireAuth, requireAdmin, optionalAuth } from "../middlewares/auth.js";
import { listActivities, createActivityHandler, deleteActivity } from "../controllers/activityController.js";

const router = express.Router();

// Public: list activities (optionally ?limit= and ?publicOnly=)
router.get("/", optionalAuth, listActivities);

// Admin: create activity with media upload
router.post("/", requireAuth, requireAdmin, ...createActivityHandler);

// Admin: delete activity
router.delete("/:id", requireAuth, requireAdmin, deleteActivity);

export default router;
