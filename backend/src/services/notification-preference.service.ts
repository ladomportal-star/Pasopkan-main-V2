import { db } from "../config/database.ts";

export const notificationPreferenceDefaults = {
  pushEnabled: true,
  emailEnabled: true,
  systemUpdatesEnabled: true,
  eventStatusEnabled: true,
  refundsEnabled: true,
  payoutsEnabled: true,
};

type NotificationPreferences = typeof notificationPreferenceDefaults;

async function getUserId(authId: string) {
  const user = await db.user.findUnique({ where: { authId }, select: { id: true } });
  if (!user) throw new Error("Account not found");
  return user.id;
}

export async function getNotificationPreferences(authId: string) {
  const userId = await getUserId(authId);
  return db.notificationPreference.upsert({
    where: { userId },
    create: { userId },
    update: {},
    select: {
      pushEnabled: true,
      emailEnabled: true,
      systemUpdatesEnabled: true,
      eventStatusEnabled: true,
      refundsEnabled: true,
      payoutsEnabled: true,
      updatedAt: true,
    },
  });
}

export async function saveNotificationPreferences(
  authId: string,
  preferences: NotificationPreferences,
) {
  const userId = await getUserId(authId);
  return db.notificationPreference.upsert({
    where: { userId },
    create: { userId, ...preferences },
    update: preferences,
    select: {
      pushEnabled: true,
      emailEnabled: true,
      systemUpdatesEnabled: true,
      eventStatusEnabled: true,
      refundsEnabled: true,
      payoutsEnabled: true,
      updatedAt: true,
    },
  });
}
