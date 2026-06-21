import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://ookkzvdqugtiwihnlgtl.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_ca5fGoPtJiYbgb0PvTki_g_giSylU7N";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
