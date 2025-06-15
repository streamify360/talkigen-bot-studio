
-- Add a column to track the GCP file path for easier deletion
ALTER TABLE knowledge_base ADD COLUMN IF NOT EXISTS gcp_file_path TEXT;

-- Update existing records to have proper GCP paths (for files that have content URLs)
UPDATE knowledge_base 
SET gcp_file_path = CASE 
  WHEN content LIKE 'https://storage.googleapis.com/talkigen_laravel/%' 
  THEN SUBSTRING(content FROM 'https://storage\.googleapis\.com/talkigen_laravel/(.*)$')
  ELSE NULL
END
WHERE file_type != 'knowledge_base' AND content IS NOT NULL;
