// Lightweight helpers to map between local tasks and iCal VTODO

export function icsDateFromYmd(ymd: string): string {
  return ymd.replace(/-/g, "");
}

export function ymdFromIcsDate(value: string): string | null {
  if (!value) return null;
  const v = value.trim();
  if (/^\d{8}$/.test(v)) return `${v.slice(0,4)}-${v.slice(4,6)}-${v.slice(6,8)}`;
  if (/^\d{8}T/.test(v)) return `${v.slice(0,4)}-${v.slice(4,6)}-${v.slice(6,8)}`;
  return null;
}






