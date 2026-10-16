import { HttpError } from "../middlewares/error.middleware.ts";
import { attendeeQuestionsSchema } from "../validators/event.validator.ts";

export interface AttendeeInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  customAnswers?: Record<string, string | string[]>;
}

export function registrationQuestions(value: unknown) {
  const parsed = attendeeQuestionsSchema.safeParse(value ?? []);
  if (!parsed.success) throw new HttpError(422, "Event registration questions need correction");
  return parsed.data.filter((q) => q.label);
}

export function validateAttendees(
  questionsValue: unknown, requireEveryTicket: boolean, quantity: number,
  submitted: AttendeeInput[] = [],
): AttendeeInput[] {
  const questions = registrationQuestions(questionsValue);
  if (requireEveryTicket && submitted.length !== quantity)
    throw new HttpError(422, "Provide guest information for every ticket");
  const entries = requireEveryTicket ? submitted : [submitted[0]];
  for (const entry of entries) {
    if (requireEveryTicket && (!entry?.firstName?.trim() || !entry.lastName?.trim() ||
      !entry.phone?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(entry.email ?? "")))
      throw new HttpError(422, "Complete guest name, phone and email");
    for (const question of questions) {
      const answer = entry?.customAnswers?.[question.id];
      const missing = question.type === "checkbox" ? answer !== "true" :
        Array.isArray(answer) ? !answer.length : !answer?.trim();
      if (missing) {
        if (question.required) throw new HttpError(422, `Answer required: ${question.label}`);
        continue;
      }
      if (["single_choice", "multi_choice", "options"].includes(question.type)) {
        const answers = Array.isArray(answer) ? answer : [answer];
        if ((question.type !== "multi_choice" && answers.length !== 1) ||
          answers.some((value) => !question.options?.includes(value!)))
          throw new HttpError(422, `Invalid answer: ${question.label}`);
      } else if (Array.isArray(answer)) {
        throw new HttpError(422, `Invalid answer: ${question.label}`);
      } else if (question.type === "url" && !/^https?:\/\/[^\s]+$/i.test(answer!)) {
        throw new HttpError(422, `Invalid URL: ${question.label}`);
      }
    }
  }
  return Array.from({ length: quantity }, (_, i) => submitted[requireEveryTicket ? i : 0] ?? {});
}

/** Dates entered in the organizer form are interpreted in Asia/Vientiane. */
export function saleBoundary(date: unknown, time: unknown, end: boolean): Date | null {
  if (!date || typeof date !== "string") return null;
  const local = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(date);
  const iso = local ? `${local[3]}-${local[2].padStart(2, "0")}-${local[1].padStart(2, "0")}` : date.slice(0, 10);
  const clock = typeof time === "string" && time ? time : end ? "23:59:59.999" : "00:00:00";
  const value = new Date(`${iso}T${clock}+07:00`);
  if (!Number.isFinite(value.getTime())) throw new HttpError(422, "Invalid ticket sale schedule");
  return value;
}
