import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://qvtthgoeythyqdpslsqh.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2dHRoZ29leXRoeXFkcHNsc3FoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3NjYzNDUsImV4cCI6MjEwMjM0MjM0NX0.0xVgaUHGwJCuZVO1gLBn18hiP5cHwqQnLrA46SRi5Ao"; // App.jsx dagi to'liq SUPABASE_ANON_KEY kalitingiz

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);