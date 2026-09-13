import { Router } from "express";
import healthRoutes from "./health.routes.ts";
import mapsRoutes from "./maps.routes.ts";
import paymentRoutes from "./payment.routes.ts";
import accountRoutes from "./account.routes.ts";
import eventRoutes from "./event.routes.ts";
import ticketRoutes from "./ticket.routes.ts";
import checkinRoutes from "./checkin.routes.ts";
import reviewRoutes from "./review.routes.ts";
import otpRoutes from "./otp.routes.ts";

const apiRouter = Router();

apiRouter.use(healthRoutes);
apiRouter.use(mapsRoutes);
apiRouter.use(paymentRoutes);
apiRouter.use(accountRoutes);
apiRouter.use(eventRoutes);
apiRouter.use(ticketRoutes);
apiRouter.use(checkinRoutes);
apiRouter.use(reviewRoutes);
apiRouter.use(otpRoutes);

export default apiRouter;
