import { supabase } from '../lib/supabaseClient';
import { AppliedPromo } from '../hooks/useEnrollmentStorage';
import { DEFAULT_PROMO_PDID } from '../constants/promoDefaults';

export interface PromoCodeValidationResult {
  success: boolean;
  promo?: AppliedPromo;
  error?: string;
}

/** Escape for PostgREST `ilike` so `%` and `_` in user input are literal. */
export function escapePromoCodeForILike(trimmed: string): string {
  return trimmed.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
}

export function effectivePdid(userPdid?: number | null): number {
  const n = userPdid == null ? NaN : Number(userPdid);
  return !Number.isNaN(n) && n > 0 ? Math.floor(n) : DEFAULT_PROMO_PDID;
}

/** Matches docs/promocode.md §4: empty row, asterisk/ALL/ANY, else must equal enrollment PDID string. */
export function promoRowMatchesEnrollmentProduct(
  productRaw: string | null | undefined,
  effectivePdId: number,
): boolean {
  const p = String(productRaw ?? '').trim();
  if (p === '') return true;
  const upper = p.toUpperCase();
  if (upper === '*' || upper === 'ALL' || upper === 'ANY') return true;
  return p === String(effectivePdId);
}

export async function validatePromoCode(
  code: string,
  pdid?: number | null,
): Promise<PromoCodeValidationResult> {
  if (!code || code.trim() === '') {
    return {
      success: false,
      error: 'Please enter a promo code',
    };
  }

  if (!supabase) {
    return {
      success: false,
      error: 'Promo validation is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.',
    };
  }

  const trimmed = code.trim();
  const escaped = escapePromoCodeForILike(trimmed);
  const eff = effectivePdid(pdid ?? null);

  try {
    const { data: rows, error } = await supabase
      .from('promocodes')
      .select('code, product, discount_amount')
      .ilike('code', escaped)
      .eq('active', true)
      .limit(1);

    if (error) {
      console.error('Error validating promo code:', error);
      return {
        success: false,
        error: 'Error validating promo code. Please try again.',
      };
    }

    const row = rows?.[0];
    if (!row) {
      return {
        success: false,
        error: 'Invalid promo code',
      };
    }

    if (!promoRowMatchesEnrollmentProduct(row.product, eff)) {
      return {
        success: false,
        error: 'This promo code is not valid for this enrollment product.',
      };
    }

    return {
      success: true,
      promo: {
        code: row.code,
        product: row.product,
        discountAmount: parseFloat(String(row.discount_amount)),
      },
    };
  } catch (e) {
    console.error('Error validating promo code:', e);
    return {
      success: false,
      error: 'Network error. Please check your connection and try again.',
    };
  }
}

export function applyPromoDiscount(
  initialPayment: number,
  appliedPromo: AppliedPromo | null,
): number {
  if (!appliedPromo) {
    return initialPayment;
  }

  const discountedAmount = initialPayment - appliedPromo.discountAmount;
  return Math.max(0, discountedAmount);
}
