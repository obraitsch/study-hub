-- Add credits column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 0;

-- Create material_purchases table
CREATE TABLE IF NOT EXISTS material_purchases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    material_id UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
    credits_spent INTEGER NOT NULL,
    purchased_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id, material_id)
);

-- Add credit_cost column to materials table
ALTER TABLE materials ADD COLUMN IF NOT EXISTS credit_cost INTEGER DEFAULT 1;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS material_purchases_user_id_idx ON material_purchases(user_id);
CREATE INDEX IF NOT EXISTS material_purchases_material_id_idx ON material_purchases(material_id);

-- Enable RLS on material_purchases
ALTER TABLE material_purchases ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own purchases
CREATE POLICY "Users can view their own purchases"
    ON material_purchases FOR SELECT
    USING (auth.uid() = user_id);

-- Allow users to insert their own purchases
CREATE POLICY "Users can insert their own purchases"
    ON material_purchases FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Function to check if a user has access to a material
CREATE OR REPLACE FUNCTION has_material_access(user_id UUID, material_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM materials m
        LEFT JOIN material_purchases mp ON mp.material_id = m.id AND mp.user_id = user_id
        WHERE m.id = material_id
        AND (
            m.user_id = user_id  -- User is the owner
            OR mp.id IS NOT NULL  -- User has purchased the material
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 