import config from "./src/config/config.js";
import app from "./src/app.js";
import supabase from "./src/config/supabaseClient.js";

// ── Supabase connection check ─────────────────────────────────────────────────
async function checkSupabaseConnection() {
  try {
    const { error } = await supabase
      .from("products")
      .select("id")
      .limit(1);

    // If query succeeds or returns standard table/schema not found codes, DB is reachable
    const ignorableCodes = ["42P01", "PGRST116", "PGRST204", "PGRST205"];
    if (error && !ignorableCodes.includes(error.code) && !error.message?.includes("schema cache")) {
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
