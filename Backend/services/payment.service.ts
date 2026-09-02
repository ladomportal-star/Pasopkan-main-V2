/**
 * Pasopkan Payment Gateway Service
 * Manages webhook caching, transaction state verification, and payment notifications.
 */

export interface PaymentStatusRecord {
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  updatedAt: string;
  details?: any;
}

class PaymentService {
  private paymentStatuses: Record<string, PaymentStatusRecord> = {};

  /**
   * Records or updates incoming webhook notifications
   */
  recordWebhook(payload: any): { txId: string | null; isPaid: boolean; status: string } {
    const txId = String(
      payload.transactionId || 
      payload.data?.transactionId || 
      payload.id || 
      payload.orderId || 
      payload.ref || 
      ''
    ).trim();

    const statusRaw = payload.status || payload.data?.status || payload.paymentStatus || payload.state;
    const isPaid = (
      statusRaw === 'PAYMENT_COMPLETED' || 
      statusRaw === 'COMPLETED' || 
      statusRaw === 'PAID' || 
      statusRaw === 'SUCCESS' || 
      statusRaw === true
    );

    if (txId) {
      this.paymentStatuses[txId] = {
        status: isPaid ? 'COMPLETED' : String(statusRaw || 'PENDING') as any,
        updatedAt: new Date().toISOString(),
        details: payload,
      };
      console.log(`[PaymentService] Webhook stored for transaction: ${txId}, status: ${this.paymentStatuses[txId].status}`);
    }

    return { txId: txId || null, isPaid, status: statusRaw };
  }

  /**
   * Retrieves or verifies payment status for a specific transaction
   */
  async getPaymentStatus(transactionId: string): Promise<{ status: string; verified: boolean; updatedAt?: string }> {
    if (!transactionId) {
      return { status: 'UNKNOWN', verified: false };
    }

    // 1. Check local webhook store
    const local = this.paymentStatuses[transactionId];
    if (local && local.status === 'COMPLETED') {
      return { status: 'COMPLETED', verified: true, updatedAt: local.updatedAt };
    }

    // 2. Query upstream payment gateway if not yet verified
    try {
      const response = await fetch(`https://payment-gateway.phajay.co/v1/api/payment/status/${encodeURIComponent(transactionId)}`, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(3500),
      });

      if (response.ok) {
        const data: any = await response.json();
        const gwStatus = data?.status || data?.data?.status;
        if (gwStatus === 'PAYMENT_COMPLETED' || gwStatus === 'COMPLETED' || gwStatus === 'PAID' || gwStatus === 'SUCCESS') {
          this.paymentStatuses[transactionId] = {
            status: 'COMPLETED',
            updatedAt: new Date().toISOString(),
            details: data,
          };
          return { status: 'COMPLETED', verified: true, updatedAt: new Date().toISOString() };
        }
      }
    } catch (e: any) {
      // Upstream gateway poll failed or timed out, gracefully return cached state
    }

    return { status: local?.status || 'PENDING', verified: false };
  }
}

export const paymentService = new PaymentService();
