
-- Change photo_url (single) to photo_urls (array of URLs)
ALTER TABLE public.non_conformities ADD COLUMN photo_urls TEXT[] DEFAULT '{}';
-- Migrate existing data
UPDATE public.non_conformities SET photo_urls = ARRAY[photo_url] WHERE photo_url IS NOT NULL AND photo_url != '';
-- Drop old column
ALTER TABLE public.non_conformities DROP COLUMN photo_url;
