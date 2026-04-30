/** Blur + step-submit parity with dependent email duplicate validation. */

export const DEPENDENT_PHONE_DUPLICATE_MESSAGE =
  'Your phone number needs to be different from any other phone numbers';

export const DEPENDENT_SSN_DUPLICATE_MESSAGE =
  'Your Social Security number needs to be different from any other Social Security numbers';

function stripDigits(s: string): string {
  return s.replace(/\D/g, '');
}

/**
 * Returns duplicate message only when value is complete (exactly 10 digits).
 */
export function getDependentPhoneDuplicateError(
  phone: string,
  dependentIndex: number,
  dependents: { phone?: string }[],
  mainSubscriberPhone: string
): string | null {
  const d = stripDigits(phone.trim());
  if (d.length !== 10) {
    return null;
  }

  const mainD = stripDigits(mainSubscriberPhone.trim());
  if (mainD.length === 10 && d === mainD) {
    return DEPENDENT_PHONE_DUPLICATE_MESSAGE;
  }

  for (let i = 0; i < dependents.length; i++) {
    if (i === dependentIndex) continue;
    const other = dependents[i]?.phone;
    if (!other?.trim()) continue;
    const od = stripDigits(other);
    if (od.length === 10 && d === od) {
      return DEPENDENT_PHONE_DUPLICATE_MESSAGE;
    }
  }
  return null;
}

/**
 * Returns duplicate message only when value is complete (exactly 9 digits).
 */
export function getDependentSsnDuplicateError(
  ssn: string,
  dependentIndex: number,
  dependents: { ssn?: string }[],
  mainSubscriberSsn: string
): string | null {
  const d = stripDigits(ssn.trim());
  if (d.length !== 9) {
    return null;
  }

  const mainD = stripDigits(mainSubscriberSsn.trim());
  if (mainD.length === 9 && d === mainD) {
    return DEPENDENT_SSN_DUPLICATE_MESSAGE;
  }

  for (let i = 0; i < dependents.length; i++) {
    if (i === dependentIndex) continue;
    const other = dependents[i]?.ssn;
    if (!other?.trim()) continue;
    const od = stripDigits(other);
    if (od.length === 9 && d === od) {
      return DEPENDENT_SSN_DUPLICATE_MESSAGE;
    }
  }
  return null;
}

/**
 * Primary subscriber phone must differ from every dependent once both sides are complete.
 */
export function getPrimarySubscriberPhoneDuplicateError(
  phone: string,
  dependents: { phone?: string }[]
): string | null {
  const d = stripDigits(phone.trim());
  if (d.length !== 10) {
    return null;
  }

  for (let i = 0; i < dependents.length; i++) {
    const other = dependents[i]?.phone;
    if (!other?.trim()) continue;
    const od = stripDigits(other);
    if (od.length === 10 && d === od) {
      return DEPENDENT_PHONE_DUPLICATE_MESSAGE;
    }
  }
  return null;
}

/**
 * Primary subscriber SSN must differ from every dependent once both sides are complete.
 */
export function getPrimarySubscriberSsnDuplicateError(
  ssn: string,
  dependents: { ssn?: string }[]
): string | null {
  const d = stripDigits(ssn.trim());
  if (d.length !== 9) {
    return null;
  }

  for (let i = 0; i < dependents.length; i++) {
    const other = dependents[i]?.ssn;
    if (!other?.trim()) continue;
    const od = stripDigits(other);
    if (od.length === 9 && d === od) {
      return DEPENDENT_SSN_DUPLICATE_MESSAGE;
    }
  }
  return null;
}
