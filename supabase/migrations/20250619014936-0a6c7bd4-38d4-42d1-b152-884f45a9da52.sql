
-- Fix RLS policies for knowledge_base table to prevent unauthorized errors
DROP POLICY IF EXISTS "select_knowledge_base" ON public.knowledge_base;
DROP POLICY IF EXISTS "insert_knowledge_base" ON public.knowledge_base;
DROP POLICY IF EXISTS "update_knowledge_base" ON public.knowledge_base;
DROP POLICY IF EXISTS "delete_knowledge_base" ON public.knowledge_base;

-- Enable RLS on knowledge_base table
ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;

-- Create comprehensive RLS policies for knowledge_base
CREATE POLICY "Users can view their own knowledge base items"
  ON public.knowledge_base
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own knowledge base items"
  ON public.knowledge_base
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own knowledge base items"
  ON public.knowledge_base
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own knowledge base items"
  ON public.knowledge_base
  FOR DELETE
  USING (auth.uid() = user_id);
