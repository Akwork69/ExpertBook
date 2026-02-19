import cors from "cors";
import express from "express";
import expertsRoutes from "./routes/experts.routes.js";
import bookingsRoutes from "./routes/bookings.routes.js";
import { errorHandler } from "./middleware/error-handler.js";

const app = express();
const port = Number.parseInt(process.env.PORT || "4000", 10);

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({ ok: true });
});

app.use("/experts", expertsRoutes);
app.use("/bookings", bookingsRoutes);

app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use(errorHandler);

app.listen(port, () => {
  console.log(`API server listening on http://localhost:${port}`);
});
