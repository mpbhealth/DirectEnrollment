/** Used on dependent email blur and on step submit. See docs/dependent-email-duplicate-blur-validation-pattern.md */

const BASIC_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const DEPENDENT_EMAIL_DUPLICATE_MESSAGE =
  'Your email address needs to be different from any other email addresses';

function normalizeEmail(s: string): string {
  return s.trim().toLowerCase();
}

/**
 * Returns duplicate message only when the value is non-empty and passes basic email format.
 * Empty or invalid format → null (handle required/format elsewhere).
 */
export function getDependentEmailDuplicateError(
  email: string,
  dependentIndex: number,
  dependents: { email?: string }[],
  mainSubscriberEmail: string
): string | null {
  const trimmed = email.trim();
  if (!trimmed || !BASIC_EMAIL_REGEX.test(trimmed)) {
    return null;
  }
  const e = normalizeEmail(trimmed);
  const mainTrim = mainSubscriberEmail.trim();
  if (mainTrim && e === normalizeEmail(mainTrim)) {
    return DEPENDENT_EMAIL_DUPLICATE_MESSAGE;
  }
  for (let i = 0; i < dependents.length; i++) {
    if (i === dependentIndex) continue;
    const other = dependents[i]?.email;
    if (!other?.trim()) continue;
    if (e === normalizeEmail(other)) {
      return DEPENDENT_EMAIL_DUPLICATE_MESSAGE;
    }
  }
  return null;
}
