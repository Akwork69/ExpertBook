import { Router } from "express";
import { getExpert, getExperts } from "../controllers/experts.controller.js";

const router = Router();

router.get("/", getExperts);
router.get("/:id", getExpert);

export default router;
