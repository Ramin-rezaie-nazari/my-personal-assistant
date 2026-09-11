export function getDateKeyInTimezone(now: Date, timezone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now);
  const values = Object.fromEntries(
    parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]),
  ) as Record<string, string>;
  return `${values.year}-${values.month}-${values.day}`;
}

export function zonedDateTimeToUtc(dateKey: string, time: string, timezone: string): Date {
  const [year, month, day] = dateKey.split('-').map(Number);
  const [hour, minute, second = 0] = time.split(':').map(Number);
  let guess = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  for (let i = 0; i < 3; i += 1) {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
    }).formatToParts(guess);
    const values = Object.fromEntries(
      parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]),
    ) as Record<string, string>;
    const asUtc = Date.UTC(Number(values.year), Number(values.month) - 1, Number(values.day), Number(values.hour), Number(values.minute), Number(values.second));
    const targetUtc = Date.UTC(year, month - 1, day, hour, minute, second);
    guess = new Date(guess.getTime() + targetUtc - asUtc);
  }
  return guess;
}

export function assertValidTimezone(timezone: string): string {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: timezone }).format();
    return timezone;
  } catch {
    throw new Error(`Invalid IANA timezone: ${timezone}`);
  }
}
