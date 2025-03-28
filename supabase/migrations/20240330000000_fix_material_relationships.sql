-- Drop existing foreign key constraints if they exist
ALTER TABLE IF EXISTS materials
DROP CONSTRAINT IF EXISTS materials_user_id_fkey,
DROP CONSTRAINT IF EXISTS materials_university_id_fkey;

-- Add correct foreign key constraints
ALTER TABLE materials
ADD CONSTRAINT materials_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

ALTER TABLE materials
ADD CONSTRAINT materials_university_id_fkey
FOREIGN KEY (university_id)
REFERENCES universities(id)
ON DELETE SET NULL;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS materials_user_id_idx ON materials(user_id);
CREATE INDEX IF NOT EXISTS materials_university_id_idx ON materials(university_id); 