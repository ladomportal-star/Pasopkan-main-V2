import { db } from "../config/database.ts";
import { HttpError } from "../middlewares/error.middleware.ts";

// Live gateway operations are deliberately disabled until vendor documentation,
// credentials, webhook authentication and amount/order verification are implemented.
class PaymentService {
  async recordWebhook(_payload: unknown): Promise<{txId: string|null; isPaid: boolean; status: string}> {
    throw new HttpError(503, "Payment provider integration is not configured");
  }
  async getPaymentStatus(transactionId: string, uid?: string) {
    if (!uid) throw new HttpError(401, "Sign in to view payment status");
    const payment = await db.payment.findFirst({ where: { provider: "phajay", providerTransactionId: transactionId, order: { user: { authId: uid } } } });
    if (!payment) throw new HttpError(404, "Payment not found");
    return { status: payment.state.toUpperCase(), verified: payment.state === "completed" && payment.verifiedAt !== null };
  }
}
export const paymentService = new PaymentService();
