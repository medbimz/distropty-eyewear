import { createClient } from "@supabase/supabase-js";

// ⚠️ Remplace ces deux valeurs par TES clés Supabase
// (Project Settings → Data API pour l'URL, → API Keys pour la clé "anon public")
const SUPABASE_URL = "https://ookkzvdqugtiwihnlgtl.supabase.co/rest/v1/
";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9va2t6dmRxdWd0aXdpaG5sZ3RsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE5MzQwNjMsImV4cCI6MjA5NzUxMDA2M30.3SnhxPU7XQVmD3yVUDN1-t8GYrd5sq4bCVg59yCqvgc
";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
