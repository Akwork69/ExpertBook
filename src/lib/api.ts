import { supabase } from "@/integrations/supabase/client";

export type Expert = {
  id: string;
  name: string;
  category: string;
  bio: string | null;
  experience_years: number;
  rating: number;
  avatar_url: string | null;
  hourly_rate: number | null;
  created_at: string;
};

export type TimeSlot = {
  id: string;
  expert_id: string;
  slot_date: string;
  start_time: string;
  end_time: string;
  is_booked: boolean;
  created_at: string;
};

export type Booking = {
  id: string;
  expert_id: string;
  time_slot_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  notes: string | null;
  status: "pending" | "confirmed" | "completed";
  created_at: string;
  experts?: Expert;
  time_slots?: TimeSlot;
};

const PAGE_SIZE = 6;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.trim();
const USE_BACKEND_API = Boolean(API_BASE_URL);
const API_TIMEOUT_MS = 8000;

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  if (!USE_BACKEND_API || !API_BASE_URL) {
    throw new Error("Backend API base URL is not configured");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    signal: controller.signal,
    ...init,
  }).finally(() => clearTimeout(timeout));

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message = payload?.error || payload?.message || "Request failed";
    throw new Error(message);
  }

  return payload as T;
}

function normalizeSupabaseError(error: any): Error {
  const message = String(error?.message || "");
  const code = String(error?.code || "");

  if (code === "23505" || message.toLowerCase().includes("already booked")) {
    return new Error("This time slot is already booked");
  }

  if (message) return new Error(message);
  return new Error("Request failed");
}

function isBackendUnavailable(error: any): boolean {
  const message = String(error?.message || "").toLowerCase();
  const name = String(error?.name || "").toLowerCase();
  return (
    name.includes("aborterror") ||
    message.includes("failed to fetch") ||
    message.includes("networkerror") ||
    message.includes("load failed") ||
    message.includes("network request failed")
  );
}

async function withBackendReadFallback<T>(
  backendCall: () => Promise<T>,
  supabaseFallback: () => Promise<T>
): Promise<T> {
  if (!USE_BACKEND_API) return supabaseFallback();

  try {
    return await backendCall();
  } catch (error) {
    if (isBackendUnavailable(error)) {
      return supabaseFallback();
    }
    throw error;
  }
}

export async function fetchExperts({
  page = 1,
  category,
  search,
}: {
  page?: number;
  category?: string;
  search?: string;
}) {
  const fromSupabase = async () => {
    let query = supabase.from("experts").select("*", { count: "exact" });

    if (category && category !== "all") {
      query = query.eq("category", category as any);
    }
    if (search) {
      query = query.ilike("name", `%${search}%`);
    }

    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    query = query.range(from, to).order("rating", { ascending: false });

    const { data, error, count } = await query;
    if (error) throw normalizeSupabaseError(error);
    return { experts: (data ?? []) as Expert[], total: count ?? 0, pageSize: PAGE_SIZE };
  };

  const fromBackend = async () => {
    const query = new URLSearchParams({
      page: String(page),
      limit: String(PAGE_SIZE),
    });

    if (category && category !== "all") query.set("category", category);
    if (search) query.set("search", search);

    const payload = await apiRequest<{ data: Expert[]; total: number; pageSize: number }>(
      `/experts?${query.toString()}`
    );

    return {
      experts: payload.data,
      total: payload.total,
      pageSize: payload.pageSize,
    };
  };

  return withBackendReadFallback(fromBackend, fromSupabase);
}

export async function fetchExpert(id: string) {
  const fromSupabase = async () => {
    const { data, error } = await supabase.from("experts").select("*").eq("id", id).single();
    if (error) throw normalizeSupabaseError(error);
    return data as Expert;
  };

  const fromBackend = () => apiRequest<Expert>(`/experts/${id}`);
  return withBackendReadFallback(fromBackend, fromSupabase);
}

export async function fetchTimeSlots(expertId: string) {
  const { data, error } = await supabase
    .from("time_slots")
    .select("*")
    .eq("expert_id", expertId)
    .gte("slot_date", new Date().toISOString().split("T")[0])
    .order("slot_date")
    .order("start_time");
  if (error) throw normalizeSupabaseError(error);
  return data as TimeSlot[];
}

export async function createBooking(booking: {
  expert_id: string;
  time_slot_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  notes?: string;
}) {
  if (!USE_BACKEND_API) {
    const { data, error } = await supabase.from("bookings").insert(booking).select().single();
    if (error) throw normalizeSupabaseError(error);
    return data as Booking;
  }

  return apiRequest<Booking>("/bookings", {
    method: "POST",
    body: JSON.stringify(booking),
  });
}

export async function fetchBookingsByEmail(email: string) {
  const fromSupabase = async () => {
    const { data, error } = await supabase
      .from("bookings")
      .select("*, experts(*), time_slots(*)")
      .eq("customer_email", email)
      .order("created_at", { ascending: false });
    if (error) throw normalizeSupabaseError(error);
    return data as Booking[];
  };

  const fromBackend = async () => {
    const query = new URLSearchParams({ email });
    return apiRequest<Booking[]>(`/bookings?${query.toString()}`);
  };

  return withBackendReadFallback(fromBackend, fromSupabase);
}

export async function updateBookingStatus(id: string, status: "pending" | "confirmed" | "completed") {
  if (!USE_BACKEND_API) {
    const { data, error } = await supabase
      .from("bookings")
      .update({ status })
      .eq("id", id)
      .select()
      .single();
    if (error) throw normalizeSupabaseError(error);
    return data as Booking;
  }

  return apiRequest<Booking>(`/bookings/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function subscribeToSlotChanges(expertId: string, callback: (slot: TimeSlot) => void) {
  const channel = supabase
    .channel(`slots-${expertId}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "time_slots",
        filter: `expert_id=eq.${expertId}`,
      },
      (payload) => callback(payload.new as TimeSlot)
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
