import { Router } from "express";
import healthRoutes from "./health.routes.ts";
import mapsRoutes from "./maps.routes.ts";
import paymentRoutes from "./payment.routes.ts";
import accountRoutes from "./account.routes.ts";
import ticketsRoutes from "./tickets.routes.ts";
import reviewsRoutes from "./reviews.routes.ts";

const apiRouter = Router();

// Mount individual domain routers
apiRouter.use(healthRoutes);
apiRouter.use(mapsRoutes);
apiRouter.use(paymentRoutes);
apiRouter.use(accountRoutes);
apiRouter.use(ticketsRoutes);
apiRouter.use(reviewsRoutes);

export default apiRouter;
