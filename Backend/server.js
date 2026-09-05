import config from "./src/config/config.js";
import app from "./src/app.js";
import supabase from "./src/config/supabaseClient.js";

// ── Supabase connection check ─────────────────────────────────────────────────
async function checkSupabaseConnection() {
  try {
    const { error } = await supabase
      .from("_dummy_health_check")
      .select("*")
      .limit(1);
    // A 42P01 / PGRST116 error (table not found) still means the DB is reachable
    if (error && error.code !== "42P01" && error.code !== "PGRST116") {
      console.warn("⚠️  Supabase connection warning:", error.message);
    } else {
      console.log("✅ Supabase connected successfully");
    }
  } catch (err) {
    console.error("❌ Supabase connection failed:", err.message);
    process.exit(1);
  }
}

// ── Start server ──────────────────────────────────────────────────────────────
async function startServer() {
  await checkSupabaseConnection();

  app.listen(config.port, () => {
    console.log(`🚀 Server running on http://localhost:${config.port}`);
  });
}

startServer();
