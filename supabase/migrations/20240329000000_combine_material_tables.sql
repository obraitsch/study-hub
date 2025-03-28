-- Drop existing tables and their dependencies
DROP TABLE IF EXISTS material_metadata CASCADE;
DROP TABLE IF EXISTS materials CASCADE;

-- Create the new combined materials table
CREATE TABLE materials (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL,
    content TEXT,
    url TEXT,                    -- For file materials
    original_filename TEXT,      -- For file materials
    file_type TEXT,             -- For file materials
    file_size BIGINT,           -- For file materials
    credit_cost INTEGER DEFAULT 1,
    rating DECIMAL(3,2),
    downloads INTEGER DEFAULT 0,
    is_university_specific BOOLEAN DEFAULT false,
    course_id UUID REFERENCES courses(id),
    university_id UUID REFERENCES universities(id),
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create indexes for better query performance
CREATE INDEX materials_user_id_idx ON materials(user_id);
CREATE INDEX materials_course_id_idx ON materials(course_id);
CREATE INDEX materials_university_id_idx ON materials(university_id);

-- Enable Row Level Security
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view all materials"
    ON materials FOR SELECT
    USING (true);

CREATE POLICY "Users can insert their own materials"
    ON materials FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own materials"
    ON materials FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own materials"
    ON materials FOR DELETE
    USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_materials_updated_at
    BEFORE UPDATE ON materials
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 