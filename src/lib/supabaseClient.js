import { createClient } from "@supabase/supabase-js";

const url = process.env.REACT_APP_SUPABASE_URL;
const key = process.env.REACT_APP_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  // Fail loudly in development so a missing env file is obvious.
  // The values stay in environment variables and are not hardcoded here.
  console.error("Missing REACT_APP_SUPABASE_URL or REACT_APP_SUPABASE_PUBLISHABLE_KEY.");
}

export const supabase = createClient(url || "", key || "", {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
