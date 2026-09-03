import { Router } from "express";
import { resolveMapUrl } from "../controllers/maps.controller.ts";

const router = Router();
router.get("/resolve-map-url", resolveMapUrl);
export default router;
