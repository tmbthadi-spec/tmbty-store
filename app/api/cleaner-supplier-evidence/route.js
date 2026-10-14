import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { SUPABASE_URL } from "../../../lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const expected = process.env.TMBTY_AI_ADMIN_SECRET || "";
  const provided = request.headers.get("x-miga-admin-secret") || "";
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (!expected || a.length !== b.length || !timingSafeEqual(a,b)) return NextResponse.json({error:"Unauthorized"},{status:401});
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return NextResponse.json({error:"Server not configured"},{status:503});
  const res = await fetch(SUPABASE_URL + "/rest/v1/miga_supplier_evidence?select=product_id,supplier_product_id,supplier_title,observed_option_label,observed_option_names,evidence_url,evidence_source,verified_at,notes&order=verified_at.desc&limit=200",{headers:{apikey:key,Authorization:"Bearer "+key},cache:"no-store"});
  if (!res.ok) return NextResponse.json({error:"Unable to load evidence"},{status:502});
  return NextResponse.json({evidence:await res.json()});
}
