function pad(value: number): string {
  return String(value).padStart(2, '0');
}

export function formatDateOnly(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function todayDateOnly(): string {
  return formatDateOnly(new Date());
}
