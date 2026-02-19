import { supabaseAdmin } from "./supabase.js";

export async function insertBooking(payload) {
  const { data, error } = await supabaseAdmin
    .from("bookings")
    .insert(payload)
    .select("*, experts(*), time_slots(*)")
    .single();

  if (error) throw error;
  return data;
}

export async function updateBookingStatusById(id, status) {
  const { data, error } = await supabaseAdmin
    .from("bookings")
    .update({ status })
    .eq("id", id)
    .select("*, experts(*), time_slots(*)")
    .single();

  if (error) throw error;
  return data;
}

export async function getBookingsByEmail(email) {
  const { data, error } = await supabaseAdmin
    .from("bookings")
    .select("*, experts(*), time_slots(*)")
    .eq("customer_email", email)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}
