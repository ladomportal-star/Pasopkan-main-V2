import type { Prisma } from "../lib/prisma.ts";

/** Return the stock an order reserved to its ticket tiers.
 *  The caller must hold the Order row lock and change the order's status in the same transaction,
 *  so the same reservation is never released twice. */
export async function releaseOrderStock(tx: Prisma.TransactionClient, orderId: string) {
  const items = await tx.orderItem.findMany({ where: { orderId }, select: { tierId: true } });
  const quantities = new Map<string, number>();
  for (const item of items) quantities.set(item.tierId, (quantities.get(item.tierId) ?? 0) + 1);
  for (const [tierId, quantity] of quantities)
    await tx.ticketTier.update({
      where: { id: tierId },
      data: { quantitySold: { decrement: quantity } },
    });
}
