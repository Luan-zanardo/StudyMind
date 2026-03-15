-- 1. Create a bucket named 'uploads' in Supabase Storage.
--    You can do this in your Supabase project dashboard under Storage.
--    Make sure to set public access rules if you want to display the files,
--    or create signed URLs from the backend. For this example, we'll assume
--    the files are protected and accessed via the backend.

-- 2. Create the 'processed_materials' table.
--    Go to the SQL Editor in your Supabase project and run this script.

CREATE TABLE public.processed_materials (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    file_name text NOT NULL,
    file_path text NOT NULL,
    ai_content jsonb NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT processed_materials_pkey PRIMARY KEY (id),
    CONSTRAINT processed_materials_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 3. Enable Row Level Security (RLS) for the new table.
ALTER TABLE public.processed_materials ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies to control access.

--    Users can view their own materials.
CREATE POLICY "Enable read access for own materials"
ON public.processed_materials
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

--    Users can insert their own materials.
CREATE POLICY "Enable insert for own materials"
ON public.processed_materials
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

--    Optionally, you could add policies for update and delete if needed.
--    For example, to allow users to delete their own materials:
--    CREATE POLICY "Enable delete for own materials"
--    ON public.processed_materials
--    FOR DELETE
--    TO authenticated
--    USING (auth.uid() = user_id);

