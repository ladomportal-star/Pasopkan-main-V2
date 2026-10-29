import { z } from "zod";

export const organizerAttendeesParams = z.object({ eventId: z.string().uuid() });

export const organizerAttendeesQuery = z.object({
  q: z.string().trim().max(120).optional(),
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(500).default(200),
});

export const organizerAttendeeItemParams = z.object({
  eventId: z.string().uuid(),
  itemId: z.string().uuid(),
});

export const rescheduleAttendeeBody = z.object({
  selectedDate: z.string().trim().min(1).max(40),
  selectedTime: z.string().trim().max(80).optional().nullable(),
});

export const createWalkinBody = z.object({
  attendeeName: z.string().trim().min(1).max(160),
  attendeePhone: z.string().trim().max(40).optional().nullable(),
  attendeeEmail: z.string().trim().email().max(254).optional().nullable().or(z.literal("")),
  selectedDate: z.string().trim().min(1).max(40),
  selectedTime: z.string().trim().max(80).optional().nullable(),
  tierId: z.string().uuid().optional(),
  quantity: z.coerce.number().int().min(1).max(20).default(1),
  markCheckedIn: z.boolean().default(true),
});

export const bookingOverridesBody = z.object({
  overrides: z.record(
    z.string().max(40),
    z.object({
      isClosed: z.boolean().optional(),
      notes: z.string().max(2000).optional(),
      slotOverrides: z
        .record(
          z.string().max(80),
          z.object({
            isPaused: z.boolean().optional(),
            extraCapacity: z.number().int().optional(),
          }),
        )
        .optional(),
    }),
  ),
});

export const organizerBankDetailsBody = z.object({
  bankName: z.string().trim().min(1).max(120),
  accountHolder: z.string().trim().min(1).max(160),
  accountNumber: z.string().trim().min(4).max(60),
});

export type OrganizerAttendeesQuery = z.infer<typeof organizerAttendeesQuery>;
export type RescheduleAttendeeBody = z.infer<typeof rescheduleAttendeeBody>;
export type CreateWalkinBody = z.infer<typeof createWalkinBody>;
export type BookingOverridesBody = z.infer<typeof bookingOverridesBody>;
export type OrganizerBankDetailsBody = z.infer<typeof organizerBankDetailsBody>;
