-- Add new location fields to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS state text,
ADD COLUMN IF NOT EXISTS pincode text;