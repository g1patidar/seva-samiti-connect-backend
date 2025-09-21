import express from "express";
import { registerUser, loginUser, logoutUser, getMe, updateMe, changePassword } from "../controllers/userController.js";
import { requireAuth } from "../middlewares/auth.js";

const router = express.Router();

// @route POST /api/users/register
router.post("/register", registerUser);

// @route POST /api/users/login
router.post("/login", loginUser);
router.post("/logout", logoutUser);
router.get("/me", requireAuth, getMe);
router.put("/me", requireAuth, updateMe);
router.put("/change-password", requireAuth, changePassword);

export default router;
