/** Convert a Lao mobile number to the E.164 format required by Supabase Auth. */
export function normalizeLaoMobilePhone(input: string): string {
  const digits = input.replace(/\D/g, "");
  if (/^020\d{8}$/.test(digits)) return `+856${digits.slice(1)}`;
  if (/^20\d{8}$/.test(digits)) return `+856${digits}`;
  if (/^85620\d{8}$/.test(digits)) return `+${digits}`;
  return input.trim();
}

export const isLaoMobilePhone = (phone: string) => /^\+85620\d{8}$/.test(phone);
