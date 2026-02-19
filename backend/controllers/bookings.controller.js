import { z } from "zod";
import { getBookingsByEmail, insertBooking, updateBookingStatusById } from "../models/bookings.model.js";

const bookingSchema = z.object({
  expert_id: z.string().uuid("Invalid expert_id"),
  time_slot_id: z.string().uuid("Invalid time_slot_id"),
  customer_name: z.string().trim().min(1, "Name is required").max(100),
  customer_email: z.string().trim().email("Invalid email").max(255),
  customer_phone: z.string().trim().min(7, "Phone must be at least 7 digits").max(20),
  notes: z.string().max(500).optional(),
});

const statusSchema = z.object({
  status: z.enum(["pending", "confirmed", "completed"]),
});

const emailQuerySchema = z.object({
  email: z.string().trim().email("Valid email query param is required"),
});

function validationError(res, error) {
  return res.status(400).json({
    error: "Validation failed",
    details: error.flatten(),
  });
}

export async function createBooking(req, res, next) {
  const parsed = bookingSchema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);

  try {
    const booking = await insertBooking(parsed.data);
    res.status(201).json(booking);
  } catch (error) {
    next(error);
  }
}

export async function patchBookingStatus(req, res, next) {
  const parsed = statusSchema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);

  try {
    const booking = await updateBookingStatusById(req.params.id, parsed.data.status);
    res.status(200).json(booking);
  } catch (error) {
    next(error);
  }
}

export async function listBookings(req, res, next) {
  const parsed = emailQuerySchema.safeParse(req.query);
  if (!parsed.success) return validationError(res, parsed.error);

  try {
    const bookings = await getBookingsByEmail(parsed.data.email);
    res.status(200).json(bookings);
  } catch (error) {
    next(error);
  }
}
