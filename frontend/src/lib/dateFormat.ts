/** Format an event date as DD/MM/YYYY without shifting date-only values by timezone. */
export function formatEventDateDDMMYYYY(value?: string | null): string {
  if (!value?.trim()) return "";

  const dateValue = value.trim();
  const isoDate = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/.exec(dateValue);
  const localDate = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(dateValue);

  if (isoDate) {
    const [, year, month, day] = isoDate;
    return `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year}`;
  }
  if (localDate) {
    const [, day, month, year] = localDate;
    return `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year}`;
  }

  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return dateValue;
  const day = String(parsed.getDate()).padStart(2, "0");
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}/${parsed.getFullYear()}`;
}
