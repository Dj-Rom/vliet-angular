export function formatDateTime(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0'); // месяцы 0-11
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}
export const PL_MONTHS: Record<string, string> = {
  sty: '01',
  lut: '02',
  mar: '03',
  kwi: '04',
  maj: '05',
  cze: '06',
  lip: '07',
  sie: '08',
  wrz: '09',
  paź: '10',
  lis: '11',
  gru: '12',
};

export function formatToYYYYMMDD(dateStr: string): string {
  const parts = dateStr.toLowerCase().split(' ');

  if (parts.length !== 3) return '';

  const [dd, mon, yyyy] = parts;
  const mm = PL_MONTHS[mon];

  if (!mm) return '';

  return `${yyyy}-${mm}-${dd.padStart(2, '0')}`;
}

export function formatCalendar(dateStr: string): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return ''; // проверка на корректность

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0'); // месяцы 0-11
  const dd = String(date.getDate()).padStart(2, '0');

  return `${yyyy}-${mm}-${dd}`;
}
export function mergeDateTime(date: string, time: string): string {
  if (!date || !time) return '';
  return `${formatToYYYYMMDD(date)}T${time}`;
}
export function formatForPDF(date: string) {
  const res = date.split('T');
  return res[0] ? `${res[0]} ${res[1]}` : null;
}

export function safeDate(value?: string): Date | null {
  if (!value) return null;
  const d = new Date(formatToYYYYMMDD(value.split('T')[0]));
  return isNaN(d.getTime()) ? null : d;
}
export function parsePolishDate(dateStr: string): Date {
  const months: Record<string, number> = {
    Sty: 0,
    Lut: 1,
    Mar: 2,
    Kwi: 3,
    Maj: 4,
    Cze: 5,
    Lip: 6,
    Sie: 7,
    Wrz: 8,
    Paź: 9,
    Lis: 10,
    Gru: 11,
  };

  const [day, monthStr, year, time] = dateStr.split(' ');
  const [hours, minutes] = time.split(':').map(Number);

  return new Date(Number(year), months[monthStr], Number(day), hours, minutes);
}
