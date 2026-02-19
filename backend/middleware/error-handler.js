export function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  const message = typeof err?.message === "string" ? err.message : "Internal server error";
  const status = err?.code === "PGRST116" ? 404 : 500;

  res.status(status).json({
    error: message,
  });
}
