import express from "express";
import {
  listDonations,
  submitDonation,
  recentPublicDonations,
  donationsByUserId,
  donationsByEmail,
  getDonation,
  updateDonation,
  deleteDonation,
  processCheckoutPayment,
} from "../controllers/donationController.js";
import { optionalAuth, requireAuth, authorizeSelfByParam } from "../middlewares/auth.js";

const router = express.Router();

// Order matters: specific routes before param routes
router.get("/", optionalAuth, listDonations);
router.get("/recent", recentPublicDonations);
router.get("/user/:userId", requireAuth, authorizeSelfByParam("userId", "id"), donationsByUserId);
router.get("/by-email/:email", requireAuth, authorizeSelfByParam("email", "email"), donationsByEmail);
router.get("/:id", getDonation);

router.post("/", optionalAuth, processCheckoutPayment);
router.put("/:id", requireAuth, updateDonation);
router.delete("/:id", requireAuth, deleteDonation);

router.post('/stripe/webhook', express.raw({ type: 'application/json' }),submitDonation)

export default router;
