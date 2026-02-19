import { supabaseAdmin } from "./supabase.js";

export async function listExperts({ page, limit, category, search }) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabaseAdmin.from("experts").select("*", { count: "exact" });

  if (category && category !== "all") {
    query = query.eq("category", category);
  }
  if (search) {
    query = query.ilike("name", `%${search}%`);
  }

  const { data, error, count } = await query.range(from, to).order("rating", { ascending: false });
  if (error) throw error;

  return {
    data: data || [],
    total: count || 0,
    page,
    pageSize: limit,
  };
}

export async function getExpertById(id) {
  const { data, error } = await supabaseAdmin.from("experts").select("*").eq("id", id).single();
  if (error) throw error;
  return data;
}
