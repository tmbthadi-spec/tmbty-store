import { SUPABASE_URL } from "../../../lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({
    ready: Boolean(process.env.TMBTY_AI_ADMIN_SECRET && process.env.SUPABASE_SERVICE_ROLE_KEY),
    adminSecretConfigured: Boolean(process.env.TMBTY_AI_ADMIN_SECRET),
    databaseCredentialConfigured: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    databaseHost: new URL(SUPABASE_URL).host,
    message: "Cleaner write actions remain disabled until secure server credentials and administrator approval are configured."
  }, { headers: { "Cache-Control": "no-store" } });
}
