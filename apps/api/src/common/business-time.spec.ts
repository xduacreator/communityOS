import { businessDateKey, startOfBusinessDay } from './business-time';

describe('business time (Asia/Jakarta)', () => {
  it('starts the day at 00:00 WIB, not 00:00 UTC', () => {
    // 06:30 WIB on 23 Oct is still 22 Oct in UTC
    const morning = new Date('2026-10-22T23:30:00Z');
    expect(startOfBusinessDay(morning, 'Asia/Jakarta').toISOString()).toBe(
      '2026-10-22T17:00:00.000Z',
    );
    expect(businessDateKey(morning, 'Asia/Jakarta')).toBe('2026-10-23');
  });

  it('keeps late evening WIB on the same local day', () => {
    const evening = new Date('2026-10-23T16:59:59Z'); // 23:59:59 WIB
    expect(startOfBusinessDay(evening, 'Asia/Jakarta').toISOString()).toBe(
      '2026-10-22T17:00:00.000Z',
    );
    expect(businessDateKey(evening, 'Asia/Jakarta')).toBe('2026-10-23');
  });
});
