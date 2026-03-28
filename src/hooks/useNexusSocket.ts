import { useEffect, useRef, useState, useCallback } from 'react';
import type { WSMessage } from '@/types/nexus';

export function useNexusSocket(url?: string) {
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WSMessage | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>();
  const [resolvedUrl, setResolvedUrl] = useState(url ?? 'ws://localhost:8080');

  useEffect(() => {
    if (url) setResolvedUrl(url);
    else if (typeof window !== 'undefined') setResolvedUrl(`ws://${window.location.hostname}:8080`);
  }, [url]);

  const connect = useCallback(() => {
    try {
      const ws = new WebSocket(resolvedUrl);

      ws.onopen = () => {
        setConnected(true);
        console.log('[Nexus] WebSocket connected');
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          setLastMessage(msg);
        } catch {}
      };

      ws.onclose = () => {
        setConnected(false);
        console.log('[Nexus] WebSocket disconnected. Reconnecting in 3s...');
        reconnectTimer.current = setTimeout(connect, 3000);
      };

      ws.onerror = () => {
        ws.close();
      };

      wsRef.current = ws;
    } catch {
      reconnectTimer.current = setTimeout(connect, 3000);
    }
  }, [resolvedUrl]);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [connect]);

  const send = useCallback((msg: WSMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  return { connected, lastMessage, send };
}
