// Day boundaries for attendance and reports follow the communities' local time,
// not the container clock (UTC in production).
export const BUSINESS_TIME_ZONE = process.env.APP_TIMEZONE || 'Asia/Jakarta';

function zonedParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const get = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value);
  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour: get('hour'),
    minute: get('minute'),
    second: get('second'),
  };
}

export function startOfBusinessDay(
  date: Date = new Date(),
  timeZone = BUSINESS_TIME_ZONE,
): Date {
  const p = zonedParts(date, timeZone);
  const wallClockAsUtc = Date.UTC(
    p.year,
    p.month - 1,
    p.day,
    p.hour,
    p.minute,
    p.second,
  );
  const offsetMs = wallClockAsUtc - Math.floor(date.getTime() / 1000) * 1000;
  return new Date(Date.UTC(p.year, p.month - 1, p.day) - offsetMs);
}

export function businessDateKey(
  date: Date,
  timeZone = BUSINESS_TIME_ZONE,
): string {
  const p = zonedParts(date, timeZone);
  return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`;
}
