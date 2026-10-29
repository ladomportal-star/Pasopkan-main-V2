import { Router } from "express";
import healthRoutes from "./health.routes.ts";
import mapsRoutes from "./maps.routes.ts";
import paymentRoutes from "./payment.routes.ts";
import accountRoutes from "./account.routes.ts";
import eventRoutes from "./event.routes.ts";
import ticketRoutes from "./ticket.routes.ts";
import checkinRoutes from "./checkin.routes.ts";
import otpRoutes from "./otp.routes.ts";
import notificationRoutes from "./notification.routes.ts";
import moderationRoutes from "./moderation.routes.ts";
import mediaRoutes from "./media.routes.ts";
import payoutRoutes from "./payout.routes.ts";
import staffRoutes from "./staff.routes.ts";
import eventSubmissionOtpRoutes from "./event-submission-otp.routes.ts";
import organizerTermsRoutes from "./organizer-terms.routes.ts";
import organizerRoutes from "./organizer.routes.ts";
import { requireAuth, requireRegisteredUser } from "../middlewares/auth.middleware.ts";

const apiRouter = Router();

// Default-deny access to application data, including future routes. The public
// event catalog is the only application-data read available before sign-in.
apiRouter.use(async (req, res, next) => {
  res.setHeader("Cache-Control", "private, no-store");
  res.vary("Authorization");
  const path = req.path.replace(/\/+$/, "").toLowerCase();
  const infrastructure =
    (req.method === "GET" && path === "/health") ||
    (req.method === "GET" && path === "/events") ||
    (req.method === "GET" && path === "/media/url") ||
    (req.method === "GET" && path === "/blogs") ||
    (req.method === "GET" && path.startsWith("/site-settings/")) ||
    (req.method === "GET" && ["/webhook/payment", "/payment/webhook"].includes(path)) ||
    (req.method === "POST" &&
      ["/otp/send", "/otp/verify", "/webhook/payment", "/payment/webhook"].includes(path));
  if (infrastructure) return next();
  return requireAuth(req, res, () => requireRegisteredUser(req, res, next));
});

apiRouter.use(healthRoutes);
apiRouter.use(mapsRoutes);
apiRouter.use(paymentRoutes);
apiRouter.use(accountRoutes);
apiRouter.use(eventRoutes);
apiRouter.use(ticketRoutes);
apiRouter.use(checkinRoutes);
apiRouter.use(otpRoutes);
apiRouter.use(notificationRoutes);
apiRouter.use(moderationRoutes);
apiRouter.use(mediaRoutes);
apiRouter.use(payoutRoutes);
apiRouter.use(staffRoutes);
apiRouter.use(eventSubmissionOtpRoutes);
apiRouter.use(organizerTermsRoutes);
apiRouter.use(organizerRoutes);

export default apiRouter;
