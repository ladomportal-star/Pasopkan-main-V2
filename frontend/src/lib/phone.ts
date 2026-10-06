/** Normalizes a Lao phone number's digits to the canonical 85620XXXXXXXX form the backend expects. */
export function normalizeLaoPhone(digits: string): string {
  if (digits.startsWith('856020')) return '85620' + digits.substring(6);
  if (digits.startsWith('020')) return '85620' + digits.substring(3);
  if (digits.startsWith('20')) return '85620' + digits.substring(2);
  return digits;
}
