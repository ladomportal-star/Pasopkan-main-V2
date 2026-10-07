/** Normalizes a Lao mobile number to E.164 (+85620XXXXXXXX). */
export function normalizeLaoPhone(input: string): string {
  const digits = input.replace(/\D/g, '');
  if (/^020\d{8}$/.test(digits)) return `+856${digits.slice(1)}`;
  if (/^20\d{8}$/.test(digits)) return `+856${digits}`;
  if (/^85620\d{8}$/.test(digits)) return `+${digits}`;
  return input.trim();
}

export const isValidLaoMobilePhone = (phone: string) => /^\+85620\d{8}$/.test(phone);

export function displayLaoPhone(phone: string): string {
  return phone.replace(/^(?:\+856|856)?20(\d{4})(\d{4})$/, '020 $1 $2');
}
