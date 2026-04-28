/** Default enrollment PDID when form `pdid` is missing or ≤ 0. Must match Edge `DEFAULT_PROMO_PDID` fallback. */
const envVal =
  typeof import.meta !== 'undefined' &&
  import.meta.env?.VITE_DEFAULT_PROMO_PDID !== undefined &&
  String(import.meta.env.VITE_DEFAULT_PROMO_PDID).trim() !== ''
    ? Number(import.meta.env.VITE_DEFAULT_PROMO_PDID)
    : NaN;

export const DEFAULT_PROMO_PDID =
  Number.isFinite(envVal) && envVal > 0 ? Math.floor(envVal) : 42465;
