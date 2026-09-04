import { Router } from "express";
import { validate } from "../middlewares/validate.middleware.ts";
import { resolveMapQuery } from "../validators/maps.validator.ts";
import { resolveMapUrl } from "../controllers/maps.controller.ts";

const router = Router();
router.get("/resolve-map-url", validate({ query: resolveMapQuery }), resolveMapUrl);
export default router;
