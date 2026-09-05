import { createClient } from "@supabase/supabase-js";
import config from "./config.js";

if (!config.supabaseUrl || (!config.supabaseServiceRoleKey && !config.supabasePublishableKey)) {
  throw new Error(
    "Missing Supabase env variables: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
  );
}

// Use service role key on the backend to bypass RLS.
// Falls back to publishable key if service role key is not yet configured.
const supabaseKey = config.supabaseServiceRoleKey ?? config.supabasePublishableKey;
const supabase = createClient(config.supabaseUrl, supabaseKey);

export default supabase;
