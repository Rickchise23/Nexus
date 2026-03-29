'use client';
import { useState, useRef, useEffect } from 'react';

export default function Controller() {
  const [connected, setConnected] = useState(false);
  const [dropUrl, setDropUrl] = useState('');
  const [dropTitle, setDropTitle] = useState('');
  const [goalInput, setGoalInput] = useState('');
  const [log, setLog] = useState<string[]>([]);
  const [agentMessages, setAgentMessages] = useState<{ role: string; content: string }[]>([]);
  const [agentInput, setAgentInput] = useState('');
  const [agentBusy, setAgentBusy] = useState(false);
  const [deployBusy, setDeployBusy] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const w = window as Window & { webkitSpeechRecognition?: unknown; SpeechRecognition?: unknown };
      setVoiceSupported(!!(w.SpeechRecognition || w.webkitSpeechRecognition));
    }
  }, []);

  useEffect(() => {
    const connect = () => {
      // Phone + TV must reach the standalone WS process (port 8080). Run: npm run dev:all or npm run ws
      const wsUrl =
        process.env.NEXT_PUBLIC_WS_URL ||
        `ws://${window.location.hostname}:8080`;

      const ws = new WebSocket(wsUrl);
      ws.onopen = () => { setConnected(true); addLog('Connected to Nexus'); };
      ws.onclose = () => { setConnected(false); setTimeout(connect, 3000); };
      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          addLog(`Received: ${msg.type}`);
        } catch {}
      };
      wsRef.current = ws;
    };
    connect();
    return () => wsRef.current?.close();
  }, []);

  const addLog = (msg: string) => setLog(prev => [`${new Date().toLocaleTimeString()} ${msg}`, ...prev].slice(0, 20));

  const send = (msg: Record<string, unknown>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
      addLog(`Sent: ${String(msg.type)}`);
    }
  };

  const sendAgent = async () => {
    if (!agentInput.trim() || agentBusy) return;
    const userMsg = agentInput.trim();
    setAgentInput('');
    const next = [...agentMessages, { role: 'user', content: userMsg }];
    setAgentMessages(next);
    setAgentBusy(true);
    try {
      const res = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: next.map((m) => ({ role: m.role, content: m.content })),
          notifySignal: true,
        }),
      });
      const j = await res.json();
      const text = !res.ok ? (j.error || `Error ${res.status}`) : (j.content || '—');
      setAgentMessages((prev) => [...prev, { role: 'assistant', content: typeof text === 'string' ? text : JSON.stringify(text) }]);
      send({ type: 'agent_reply', preview: String(text).slice(0, 120) });
      send({ type: 'refresh' });
    } catch (e) {
      setAgentMessages((prev) => [...prev, { role: 'assistant', content: e instanceof Error ? e.message : 'Request failed' }]);
    } finally {
      setAgentBusy(false);
    }
  };

  const triggerDeploy = async () => {
    setDeployBusy(true);
    try {
      const res = await fetch('/api/deploy', { method: 'POST' });
      const j = await res.json();
      send({ type: 'deploy_result', ok: !!j.ok, message: j.message });
      send({ type: 'refresh' });
      addLog(`Deploy: ${j.ok ? 'triggered' : 'failed'}`);
    } catch (e) {
      addLog(`Deploy error: ${e instanceof Error ? e.message : 'fail'}`);
    } finally {
      setDeployBusy(false);
    }
  };

  const startVoice = () => {
    const w = window as Window & {
      webkitSpeechRecognition?: new () => {
        lang: string;
        onresult: (ev: { results: { 0: { 0: { transcript: string } } } }) => void;
        start: () => void;
      };
      SpeechRecognition?: new () => {
        lang: string;
        onresult: (ev: { results: { 0: { 0: { transcript: string } } } }) => void;
        start: () => void;
      };
    };
    const R = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!R) return;
    const r = new R();
    r.lang = 'en-US';
    r.onresult = (ev) => {
      const t = ev.results[0][0].transcript;
      setAgentInput((prev) => (prev ? `${prev} ${t}` : t));
    };
    r.start();
  };

  const modes = [
    { key: 'morning', label: 'Morning', icon: '☀️', color: '#f59e0b' },
    { key: 'focus', label: 'Focus', icon: '🎯', color: '#06b6d4' },
    { key: 'home', label: 'Home', icon: '🏠', color: '#10b981' },
    { key: 'evening', label: 'Evening', icon: '🌅', color: '#8b5cf6' },
    { key: 'weekend', label: 'Weekend', icon: '🏈', color: '#f59e0b' },
    { key: 'night', label: 'Night', icon: '🌙', color: '#6366f1' },
  ];

  return (
    <div style={{ background: '#0a0a0f', minHeight: '100vh', fontFamily: "'DM Sans', sans-serif", color: '#d0d0d0', padding: 20 }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@300;400&family=Outfit:wght@100;200;300&display=swap');`}</style>

      {/* Header */}
      {!connected && (
        <div style={{ marginBottom: 16, padding: 14, borderRadius: 12, background: 'rgba(255,82,82,0.12)', border: '1px solid rgba(255,82,82,0.35)', fontSize: 12, lineHeight: 1.5, color: 'rgba(255,255,255,0.85)' }}>
          <strong style={{ color: '#ff8a80' }}>WebSocket disconnected.</strong> Start both servers on the Mac mini:{' '}
          <code style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: '#a5d6ff' }}>npm run dev:all</code>.
          Allow ports 3000 and 8080 in macOS Firewall for LAN access.
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div style={{ fontFamily: 'Outfit', fontWeight: 100, fontSize: 18, color: '#fff', letterSpacing: '0.3em' }}>NEXUS</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: 'JetBrains Mono' }}>Controller → TV</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: connected ? '#00c853' : '#ff5252', boxShadow: connected ? '0 0 8px #00c853' : 'none' }}/>
          <span style={{ fontSize: 11, color: connected ? '#00c853' : '#ff5252', fontFamily: 'JetBrains Mono' }}>
            {connected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Module Switcher */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: 'JetBrains Mono', letterSpacing: '0.15em', marginBottom: 10, textTransform: 'uppercase' }}>Modules</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {[
            { id: 'pulse', label: 'Pulse', color: '#6366f1' },
            { id: 'home', label: 'Home', color: '#10b981' },
            { id: 'energy', label: 'Energy', color: '#f59e0b' },
            { id: 'cameras', label: 'Cameras', color: '#ef4444' },
            { id: 'automations', label: 'Auto', color: '#06b6d4' },
            { id: 'system', label: 'System', color: '#8b5cf6' },
          ].map((m) => (
            <button type="button" key={m.id} disabled={!connected} onClick={() => send({ type: 'module_switch', module: m.id })}
              style={{ padding: '14px 8px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center', opacity: connected ? 1 : 0.45 }}>
              <div style={{ fontSize: 12, color: m.color, fontFamily: 'JetBrains Mono', fontWeight: 500 }}>{m.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Mode Switcher */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: 'JetBrains Mono', letterSpacing: '0.15em', marginBottom: 10, textTransform: 'uppercase' }}>Mode</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {modes.map(m => (
            <button type="button" key={m.key} disabled={!connected} onClick={() => send({ type: 'mode_switch', mode: m.key })}
              style={{ padding: '14px 8px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center', opacity: connected ? 1 : 0.45 }}>
              <div style={{ fontSize: 20, marginBottom: 4 }}>{m.icon}</div>
              <div style={{ fontSize: 11, color: m.color, fontFamily: 'JetBrains Mono' }}>{m.label}</div>
            </button>
          ))}
        </div>
        <button type="button" disabled={!connected} onClick={() => send({ type: 'mode_auto' })}
          style={{ width: '100%', padding: '10px 0', borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)', fontSize: 12, marginTop: 8, opacity: connected ? 1 : 0.45 }}>
          Auto Mode (time-based)
        </button>
      </div>

      {/* Content Drop */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: 'JetBrains Mono', letterSpacing: '0.15em', marginBottom: 10, textTransform: 'uppercase' }}>Drop Content</div>
        <input value={dropUrl} onChange={e => setDropUrl(e.target.value)} placeholder="Paste a YouTube or podcast URL..."
          style={{ width: '100%', padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: 14, marginBottom: 8, boxSizing: 'border-box', outline: 'none' }}/>
        <input value={dropTitle} onChange={e => setDropTitle(e.target.value)} placeholder="Title (optional, we'll auto-detect)"
          style={{ width: '100%', padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: 14, marginBottom: 8, boxSizing: 'border-box', outline: 'none' }}/>
        <button type="button" disabled={!connected} onClick={() => {
          if (dropUrl.trim()) {
            send({ type: 'content_drop', url: dropUrl.trim(), title: dropTitle.trim() || undefined });
            setDropUrl(''); setDropTitle('');
          }
        }}
          style={{ width: '100%', padding: '14px 0', borderRadius: 12, background: '#06b6d4', color: '#fff', fontSize: 14, fontWeight: 600, border: 'none', opacity: connected ? 1 : 0.45 }}>
          Drop Into Nexus
        </button>
      </div>

      {/* Add Goal */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: 'JetBrains Mono', letterSpacing: '0.15em', marginBottom: 10, textTransform: 'uppercase' }}>Add Goal</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={goalInput} onChange={e => setGoalInput(e.target.value)} placeholder="What needs to get done today?"
            onKeyDown={e => {
              if (e.key === 'Enter' && goalInput.trim()) {
                send({ type: 'goal_add', label: goalInput.trim() });
                setGoalInput('');
              }
            }}
            style={{ flex: 1, padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: 14, outline: 'none' }}/>
          <button type="button" disabled={!connected} onClick={() => {
            if (goalInput.trim()) {
              send({ type: 'goal_add', label: goalInput.trim() });
              setGoalInput('');
            }
          }}
            style={{ padding: '12px 20px', borderRadius: 12, background: '#06b6d4', color: '#fff', fontSize: 14, fontWeight: 600, border: 'none', opacity: connected ? 1 : 0.45 }}>
            +
          </button>
        </div>
      </div>

      {/* Agent Bay (couch → Claude → TV signals) */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: 'JetBrains Mono', letterSpacing: '0.15em', marginBottom: 10, textTransform: 'uppercase' }}>Agent Bay</div>
        <div style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)', borderRadius: 12, padding: 12, marginBottom: 10, maxHeight: 160, overflowY: 'auto' }}>
          {agentMessages.length === 0 && (
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>Ask Claude to check HA, ship a deploy, or git status — replies sync to the TV.</div>
          )}
          {agentMessages.map((m, i) => (
            <div key={i} style={{ marginBottom: 8, fontSize: 12, color: m.role === 'user' ? '#93c5fd' : 'rgba(255,255,255,0.75)', whiteSpace: 'pre-wrap' }}>
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', fontFamily: 'JetBrains Mono' }}>{m.role === 'user' ? 'You' : 'Claude'} · </span>
              {m.content}
            </div>
          ))}
          {agentBusy && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>Thinking…</div>}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={agentInput}
            onChange={e => setAgentInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAgent(); } }}
            placeholder="Talk to Nexus (deploy, git, home)…"
            style={{ flex: 1, padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
          />
          {voiceSupported && (
            <button type="button" onClick={startVoice} style={{ padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>
              Mic
            </button>
          )}
          <button
            type="button"
            onClick={sendAgent}
            disabled={agentBusy || !agentInput.trim()}
            style={{ padding: '12px 18px', borderRadius: 12, background: agentBusy || !agentInput.trim() ? 'rgba(255,255,255,0.06)' : '#8b5cf6', color: '#fff', fontSize: 14, fontWeight: 600, border: 'none' }}
          >
            Send
          </button>
        </div>
      </div>

      {/* Deploy Launch Pad */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: 'JetBrains Mono', letterSpacing: '0.15em', marginBottom: 10, textTransform: 'uppercase' }}>Ship (Vercel)</div>
        <button
          type="button"
          onClick={triggerDeploy}
          disabled={deployBusy}
          style={{ width: '100%', padding: '14px 0', borderRadius: 12, background: deployBusy ? 'rgba(34,197,94,0.15)' : 'rgba(34,197,94,0.2)', border: '1px solid rgba(34,197,94,0.35)', color: '#86efac', fontSize: 14, fontWeight: 600 }}
        >
          {deployBusy ? 'Deploying…' : 'Deploy Launch Pad (hook)'}
        </button>
        <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', marginTop: 8, lineHeight: 1.4 }}>
          Set VERCEL_DEPLOY_HOOK_URL on the Mac mini. TV shows a signal when this fires.
        </p>
      </div>

      {/* Quick Actions */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: 'JetBrains Mono', letterSpacing: '0.15em', marginBottom: 10, textTransform: 'uppercase' }}>Quick Actions</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[
            { label: 'Refresh Data', action: () => send({ type: 'refresh' }) },
            { label: 'Toggle Content', action: () => send({ type: 'content_toggle' }) },
            { label: 'Next Signal', action: () => send({ type: 'signal_next' }) },
            { label: 'Dismiss Signal', action: () => send({ type: 'signal_dismiss', id: 'current' }) },
          ].map((a, i) => (
            <button type="button" key={i} disabled={!connected} onClick={a.action}
              style={{ padding: '14px 8px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: 500, opacity: connected ? 1 : 0.45 }}>
              {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* Connection Log */}
      <div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', fontFamily: 'JetBrains Mono', letterSpacing: '0.15em', marginBottom: 8, textTransform: 'uppercase' }}>Log</div>
        <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.04)', padding: 12, maxHeight: 160, overflowY: 'auto' }}>
          {log.length === 0 && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.15)' }}>Waiting for activity...</div>}
          {log.map((entry, i) => (
            <div key={i} style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', fontFamily: 'JetBrains Mono', padding: '2px 0' }}>{entry}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
