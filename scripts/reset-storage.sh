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

# Delete the materials bucket
echo "Deleting materials bucket..."
curl -X DELETE \
  "https://api.supabase.com/storage/v1/bucket/materials" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN"

# Create a new materials bucket
echo "Creating new materials bucket..."
curl -X POST \
  "https://api.supabase.com/storage/v1/bucket" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "materials",
    "public": true,
    "file_size_limit": 104857600
  }'

# Set bucket policies
echo "Setting bucket policies..."
curl -X POST \
  "https://api.supabase.com/storage/v1/bucket/materials/policy" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Allow public access",
    "definition": {
      "bucket_id": "materials",
      "allowed_mime_types": ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation"],
      "max_file_size": 104857600
    }
  }'

echo "Storage reset complete!" 