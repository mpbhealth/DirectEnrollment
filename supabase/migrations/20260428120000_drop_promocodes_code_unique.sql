/*
  Removes unique enforcement on promocodes.code (inline UNIQUE + redundant unique index).

  Applies even if only one artifact exists depending on migration history.

  Afterwards: non-unique btree index keeps basic lookups usable for small tables.
*/

ALTER TABLE public.promocodes DROP CONSTRAINT IF EXISTS promocodes_code_key;

DROP INDEX IF EXISTS public.promocodes_code_key;
DROP INDEX IF EXISTS public.idx_promocodes_code;

CREATE INDEX IF NOT EXISTS idx_promocodes_code_nonunique ON public.promocodes (code);
