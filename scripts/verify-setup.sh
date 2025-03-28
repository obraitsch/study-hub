#!/bin/bash

# Check if SUPABASE_ACCESS_TOKEN is set
if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
    echo "Error: SUPABASE_ACCESS_TOKEN is not set"
    echo "Please set it with: export SUPABASE_ACCESS_TOKEN=your_token"
    exit 1
fi

# Check if SUPABASE_PROJECT_ID is set
if [ -z "$SUPABASE_PROJECT_ID" ]; then
    echo "Error: SUPABASE_PROJECT_ID is not set"
    echo "Please set it with: export SUPABASE_PROJECT_ID=your_project_id"
    exit 1
fi

echo "Verifying Supabase setup..."

# Check if materials bucket exists
echo "Checking materials bucket..."
BUCKET_EXISTS=$(curl -s -o /dev/null -w "%{http_code}" \
  "https://api.supabase.com/storage/v1/bucket/materials" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN")

if [ "$BUCKET_EXISTS" = "200" ]; then
    echo "✅ Materials bucket exists"
else
    echo "❌ Materials bucket not found"
    exit 1
fi

# Check bucket policies
echo "Checking bucket policies..."
POLICIES=$(curl -s \
  "https://api.supabase.com/storage/v1/bucket/materials/policy" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN")

if echo "$POLICIES" | grep -q "Allow public access"; then
    echo "✅ Bucket policies are set correctly"
else
    echo "❌ Bucket policies not found"
    exit 1
fi

echo "Setup verification complete! You're ready to upload materials." 