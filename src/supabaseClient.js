import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://qvtthgoeythyqdpslsqh.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2dHRoZ29leXRoeXFkcHNsc3FoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAxNzc1OTksImV4cCI6MjA1NTc1MzU5OX0.3aLpP7e4j9J7qXg4KjQ8rY1o0PZ7yL4aU1j2l9V8y_c";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
