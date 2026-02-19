import { Router } from "express";
import { createBooking, listBookings, patchBookingStatus } from "../controllers/bookings.controller.js";

const router = Router();

router.get("/", listBookings);
router.post("/", createBooking);
router.patch("/:id/status", patchBookingStatus);

export default router;
