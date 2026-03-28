import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

function repoPath(): string | null {
  const p = process.env.NEXUS_REPO_PATH?.trim();
  return p || null;
}

export function isGitPushEnabled(): boolean {
  return process.env.NEXUS_GIT_PUSH_ENABLED === 'true' || process.env.NEXUS_GIT_PUSH_ENABLED === '1';
}

export async function gitStatusSummary(): Promise<{ ok: boolean; message: string; branch?: string }> {
  const cwd = repoPath();
  if (!cwd) {
    return { ok: false, message: 'NEXUS_REPO_PATH is not set (e.g. path to your Launch Pad clone on the Mac mini).' };
  }
  try {
    const branch = (await execFileAsync('git', ['branch', '--show-current'], { cwd, maxBuffer: 512 * 1024 }))
      .stdout.toString()
      .trim();
    const status = (await execFileAsync('git', ['status', '-sb'], { cwd, maxBuffer: 512 * 1024 })).stdout.toString().trim();
    return { ok: true, message: status || 'clean', branch };
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : 'git status failed',
    };
  }
}

export async function gitPush(): Promise<{ ok: boolean; message: string }> {
  if (!isGitPushEnabled()) {
    return {
      ok: false,
      message: 'Push disabled. Set NEXUS_GIT_PUSH_ENABLED=true in .env.local only when you trust this host.',
    };
  }
  const cwd = repoPath();
  if (!cwd) {
    return { ok: false, message: 'NEXUS_REPO_PATH is not set.' };
  }
  try {
    const { stdout, stderr } = await execFileAsync('git', ['push'], {
      cwd,
      maxBuffer: 2 * 1024 * 1024,
    });
    const out = [stdout, stderr].filter(Boolean).join('\n').trim();
    return { ok: true, message: out || 'git push completed.' };
  } catch (e) {
    const err = e as { stderr?: Buffer; message?: string };
    const msg = err.stderr?.toString() || err.message || 'git push failed';
    return { ok: false, message: msg };
  }
}
