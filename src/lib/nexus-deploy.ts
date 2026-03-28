/**
 * Trigger a Vercel production deploy via deploy hook (set on the Mac mini in .env.local).
 */
export async function triggerVercelDeploy(): Promise<{
  ok: boolean;
  message: string;
  status?: number;
}> {
  const hook = process.env.VERCEL_DEPLOY_HOOK_URL?.trim();
  if (!hook) {
    return { ok: false, message: 'VERCEL_DEPLOY_HOOK_URL is not set on this Nexus host.' };
  }
  try {
    const res = await fetch(hook, { method: 'POST', redirect: 'follow' });
    const ok = res.ok;
    return {
      ok,
      message: ok ? 'Vercel deploy hook accepted.' : `Deploy hook returned HTTP ${res.status}`,
      status: res.status,
    };
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : 'Deploy hook request failed',
    };
  }
}
