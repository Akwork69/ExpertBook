import { getExpertById, listExperts } from "../models/experts.model.js";

function toPositiveInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export async function getExperts(req, res, next) {
  try {
    const page = toPositiveInt(req.query.page, 1);
    const limit = toPositiveInt(req.query.limit, 6);
    const category = typeof req.query.category === "string" ? req.query.category : undefined;
    const search = typeof req.query.search === "string" ? req.query.search.trim() : undefined;

    const result = await listExperts({ page, limit, category, search });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function getExpert(req, res, next) {
  try {
    const expert = await getExpertById(req.params.id);
    res.status(200).json(expert);
  } catch (error) {
    next(error);
  }
}
