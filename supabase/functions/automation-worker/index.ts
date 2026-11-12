import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return Response.json({ error: "Method not allowed" }, { status: 405, headers: corsHeaders });

  const workerSecret = Deno.env.get("AUTOMATION_WORKER_SECRET");
  const authorization = request.headers.get("authorization");
  if (!workerSecret || authorization !== `Bearer ${workerSecret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });
  }

  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) {
    return Response.json({ error: "Worker environment is incomplete" }, { status: 500, headers: corsHeaders });
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: jobs, error: claimError } = await supabase.rpc("claim_automation_jobs", { p_limit: 10 });
  if (claimError) return Response.json({ error: claimError.message }, { status: 500, headers: corsHeaders });

  const results: Array<{ id: string; status: string; error?: string }> = [];
  for (const job of jobs ?? []) {
    const { error: runError } = await supabase.rpc("run_automation_job", { p_job_id: job.id });
    if (runError) {
      const { error: failError } = await supabase.rpc("fail_automation_job", {
        p_job_id: job.id,
        p_error: runError.message,
      });
      results.push({ id: job.id, status: "retry_scheduled", error: failError?.message ?? runError.message });
      continue;
    }
    const { error: finishError } = await supabase.rpc("finish_automation_job", { p_job_id: job.id });
    results.push({
      id: job.id,
      status: finishError ? "processed_finish_pending" : "completed",
      ...(finishError ? { error: finishError.message } : {}),
    });
  }

  return Response.json({ claimed: jobs?.length ?? 0, results }, { headers: corsHeaders });
});
