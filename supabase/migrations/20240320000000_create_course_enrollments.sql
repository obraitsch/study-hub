-- Create course_enrollments table
CREATE TABLE IF NOT EXISTS course_enrollments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id, course_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS course_enrollments_user_id_idx ON course_enrollments(user_id);
CREATE INDEX IF NOT EXISTS course_enrollments_course_id_idx ON course_enrollments(course_id);

-- Add RLS (Row Level Security) policies
ALTER TABLE course_enrollments ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own enrollments
CREATE POLICY "Users can view their own enrollments"
    ON course_enrollments FOR SELECT
    USING (auth.uid() = user_id);

-- Allow users to insert their own enrollments
CREATE POLICY "Users can insert their own enrollments"
    ON course_enrollments FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own enrollments
CREATE POLICY "Users can delete their own enrollments"
    ON course_enrollments FOR DELETE
    USING (auth.uid() = user_id);

-- Allow users to view enrollments for courses they are enrolled in
CREATE POLICY "Users can view enrollments for their courses"
    ON course_enrollments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM course_enrollments
            WHERE course_id = course_enrollments.course_id
            AND user_id = auth.uid()
        )
    );
