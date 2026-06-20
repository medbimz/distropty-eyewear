import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://ookkzvdqugtiwihnlgtl.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFmZSSIsInJlZiI6Im9va2t6dmRxdWd0aXdpaG5sZ3RsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1MzQ4MzAsImV4cCI6MjA5ODExMDgzMH0.3SnhxPU7XQVmD3yVUDN1-t8GYrd5sq4bCVg59yCqvgc";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
