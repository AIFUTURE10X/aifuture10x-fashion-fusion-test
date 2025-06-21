
-- Create the clothing-references storage bucket for clothing uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('clothing-references', 'clothing-references', true);

-- Create RLS policies for the clothing-references bucket
CREATE POLICY "Allow public uploads to clothing-references bucket"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'clothing-references');

CREATE POLICY "Allow public access to clothing-references bucket"
ON storage.objects FOR SELECT
USING (bucket_id = 'clothing-references');

-- Create the clothing_items table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.clothing_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  brand TEXT,
  price NUMERIC DEFAULT 0,
  garment_category TEXT NOT NULL,
  supabase_image_url TEXT,
  perfect_corp_ref_id TEXT,
  colors TEXT[] DEFAULT ARRAY['custom'],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on clothing_items table
ALTER TABLE public.clothing_items ENABLE ROW LEVEL SECURITY;

-- Create policies for clothing_items (allow all operations for now)
CREATE POLICY "Allow all operations on clothing_items"
ON public.clothing_items
FOR ALL
USING (true)
WITH CHECK (true);
