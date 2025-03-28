-- Add foreign key relationships to materials table if they don't exist
DO $$ 
BEGIN
    -- Add user_id foreign key if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'materials_user_id_fkey'
    ) THEN
        ALTER TABLE materials
        ADD CONSTRAINT materials_user_id_fkey
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE;
    END IF;

    -- Add university_id foreign key if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'materials_university_id_fkey'
    ) THEN
        ALTER TABLE materials
        ADD CONSTRAINT materials_university_id_fkey
        FOREIGN KEY (university_id)
        REFERENCES universities(id)
        ON DELETE SET NULL;
    END IF;
END $$;

-- Add indexes for better query performance if they don't exist
DO $$ 
BEGIN
    -- Add user_id index if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE indexname = 'materials_user_id_idx'
    ) THEN
        CREATE INDEX materials_user_id_idx ON materials(user_id);
    END IF;

    -- Add university_id index if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE indexname = 'materials_university_id_idx'
    ) THEN
        CREATE INDEX materials_university_id_idx ON materials(university_id);
    END IF;

    -- Add course_id index if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE indexname = 'materials_course_id_idx'
    ) THEN
        CREATE INDEX materials_course_id_idx ON materials(course_id);
    END IF;
END $$;

-- Enable RLS if not already enabled
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow users to view all materials" ON materials;
DROP POLICY IF EXISTS "Allow users to insert their own materials" ON materials;
DROP POLICY IF EXISTS "Allow users to update their own materials" ON materials;
DROP POLICY IF EXISTS "Allow users to delete their own materials" ON materials;

-- Add RLS policies
CREATE POLICY "Allow users to view all materials"
ON materials FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow users to insert their own materials"
ON materials FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update their own materials"
ON materials FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to delete their own materials"
ON materials FOR DELETE
TO authenticated
USING (auth.uid() = user_id); 