import { timingSafeEqual } from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorized(request) {
  const expected = process.env.TMBTY_AI_ADMIN_SECRET;
  const supplied = request.headers.get("x-miga-admin-secret");
  if (!expected || !supplied) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(supplied);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request) {
  if (!authorized(request)) return Response.json({error:"Unauthorized"}, {status:401});
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return Response.json({error:"Server database credential not configured"}, {status:503});
  const { proposalId, action } = await request.json().catch(() => ({}));
  if (!Number.isSafeInteger(proposalId) || proposalId < 1 || !["apply","rollback"].includes(action)) {
    return Response.json({error:"Invalid request"}, {status:400});
  }
  const rpc = action === "apply" ? "miga_approve_and_apply_cleaner_proposal" : "miga_rollback_cleaner_proposal";
  const result = await fetch("https://dchbrrnywealudwripwq.supabase.co/rest/v1/rpc/" + rpc, {
    method:"POST", headers:{"apikey":serviceKey,"Authorization":"Bearer " + serviceKey,"Content-Type":"application/json"},
    body:JSON.stringify({p_proposal_id:proposalId}), cache:"no-store"
  });
  const body = await result.text();
  if (!result.ok) return Response.json({error:"Database rejected correction",detail:body.slice(0,500)}, {status:409});
  let rpcValue;
  try { rpcValue = JSON.parse(body); } catch { rpcValue = body; }
  if (rpcValue === false || rpcValue === null || (typeof rpcValue === "object" && rpcValue?.success === false)) {
    return Response.json({error:"Correction was not confirmed by database"}, {status:409});
  }
  return Response.json({ok:true, action, proposalId, databaseResult:rpcValue}, {headers:{"Cache-Control":"no-store"}});
}

export async function GET(request) {
  if (!authorized(request)) return Response.json({error:"Unauthorized"}, {status:401});
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return Response.json({error:"Server database credential not configured"}, {status:503});
  const result = await fetch("https://dchbrrnywealudwripwq.supabase.co/rest/v1/miga_cleaner_proposals?select=id,product_id,status,original_variants,proposed_variants,created_at&order=created_at.desc&limit=100", {
    headers:{"apikey":serviceKey,"Authorization":"Bearer "+serviceKey},cache:"no-store"
  });
  if (!result.ok) return Response.json({error:"Unable to load saved proposals"}, {status:502});
  const proposals = await result.json();
  return Response.json({proposals}, {headers:{"Cache-Control":"no-store"}});
}
