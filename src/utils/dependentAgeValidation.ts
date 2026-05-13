import { calculateAgeFromDOB } from './pricingLogic';

/**
 * Whether the dependent qualifies for the "minor child" relaxed contact rules.
 *
 * Child dependents under 18 may submit enrollment without email, phone, or SSN.
 * Spouses, adult children (18+), and dependents with an unparseable DOB still
 * follow the full required + format + duplicate rules.
 *
 * Keep this aligned with the server-side member payload built in
 * `supabase/functions/enrollment-api-direct/index.ts`, which already tolerates
 * empty `EMAIL` / `PHONE1` / `SSN` for dependents.
 */
export function isChildDependentUnder18ForContactOptional(
  dob: string | undefined | null,
  relationship: 'Spouse' | 'Child' | undefined | null,
): boolean {
  if (relationship !== 'Child') return false;
  const age = calculateAgeFromDOB(dob ?? '');
  return age !== null && age < 18;
}
