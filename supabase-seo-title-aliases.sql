-- Optional Hindi-script titles used as exact search aliases on each SEO Kalam page.
ALTER TABLE public.kalaam
  ADD COLUMN IF NOT EXISTS title_hindi text;

ALTER TABLE public.kalaam_urdu
  ADD COLUMN IF NOT EXISTS title_hindi text;

-- After adding the columns, fill title_hindi with the accurate Devanagari
-- spelling for each Kalam. The SEO workflow will publish the aliases automatically.
