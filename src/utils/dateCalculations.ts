export interface EffectiveDateOption {
  display: string;
  value: string;
}

/** Eastern US observes DST; `America/New_York` reflects EST/EDT correctly. */
const EFFECTIVE_DATE_TIMEZONE = 'America/New_York';

/**
 * Effective-date dropdown rollover (Membership Start Date):
 * - Options stay on the earlier schedule while the calendar day in ET is ≤ 20
 *   (through 11:59:59.999 PM Eastern on the 20th — end of ET day 20).
 * - From the start of ET calendar day 21, use the later schedule (+1 month farther out).
 *
 * Anchors year/month on the Eastern calendar (not browser local), so rollover is predictable.
 */
function easternDayOfMonthInEffectiveZone(now: Date): number {
  const formatted = new Intl.DateTimeFormat('en-US', {
    timeZone: EFFECTIVE_DATE_TIMEZONE,
    day: 'numeric',
  }).format(now);
  return parseInt(formatted, 10);
}

function easternYearMonth0(now: Date): { year: number; month0: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: EFFECTIVE_DATE_TIMEZONE,
    year: 'numeric',
    month: 'numeric',
  }).formatToParts(now);

  let year = 0;
  let month = 0;
  for (const { type, value } of parts) {
    if (type === 'year') year = parseInt(value, 10);
    else if (type === 'month') month = parseInt(value, 10);
  }

  return { year, month0: month - 1 };
}

function clampMonth(year: number, month0: number): { year: number; month0: number } {
  let y = year;
  let m = month0;
  while (m > 11) {
    m -= 12;
    y += 1;
  }
  while (m < 0) {
    m += 12;
    y -= 1;
  }
  return { year: y, month0: m };
}

export function calculateEffectiveDates(): EffectiveDateOption[] {
  const now = new Date();
  const etDay = easternDayOfMonthInEffectiveZone(now);

  /** After end of ET day 20 ⇒ first selectable month is month+3 from today's ET calendar month anchor (legacy `currentDay >= 20`). */
  const useLateBracket = etDay > 20;

  const { year: anchorY, month0: anchorM0 } = easternYearMonth0(now);

  /** First option: month after next (legacy `< 20`) vs two months farther (legacy `>= 20`). */
  const addMonths = useLateBracket ? 2 : 1;
  const start = clampMonth(anchorY, anchorM0 + addMonths);

  const dates: EffectiveDateOption[] = [];

  for (let i = 0; i < 3; i++) {
    const { year, month0 } = clampMonth(start.year, start.month0 + i);
    /** First of month as UTC avoids local browser shifting the nominal calendar date. */
    const inst = new Date(Date.UTC(year, month0, 1));

    const displayFormat = inst.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC',
    });

    const month = String(month0 + 1).padStart(2, '0');
    const valueFormat = `${month}/01/${year}`;

    dates.push({
      display: displayFormat,
      value: valueFormat,
    });
  }

  return dates;
}
