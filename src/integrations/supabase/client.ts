// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://rjvpzflhgwduveemjibw.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJqdnB6ZmxoZ3dkdXZlZW1qaWJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4MTQxNzcsImV4cCI6MjA2NTM5MDE3N30.xUw27PBtEtbo--Iz9kF7a9owzhtYj2TfsFretBeXP0c";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);