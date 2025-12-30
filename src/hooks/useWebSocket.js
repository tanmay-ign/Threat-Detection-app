import { useEffect, useRef, useState } from 'react';

const useWebSocket = (url, onMessage) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  useEffect(() => {
    const connect = () => {
      try {
        console.log('[WS] Connecting to:', url);
        const ws = new WebSocket(url);

        ws.onopen = () => {
          console.log('[WS] Connected');
          setIsConnected(true);
          reconnectAttemptsRef.current = 0;
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('[WS] Message received:', data);
            setLastMessage(data);
            
            if (onMessage) {
              onMessage(data);
            }
          } catch (error) {
            console.error('[WS] Error parsing message:', error);
          }
        };

        ws.onerror = (error) => {
          console.error('[WS] Error:', error);
        };

        ws.onclose = () => {
          console.log('[WS] Disconnected');
          setIsConnected(false);
          
          if (reconnectAttemptsRef.current < maxReconnectAttempts) {
            reconnectAttemptsRef.current += 1;
            const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
            console.log(`[WS] Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})`);
            
            reconnectTimeoutRef.current = setTimeout(() => {
              connect();
            }, delay);
          } else {
            console.log('[WS] Max reconnection attempts reached');
          }
        };

        wsRef.current = ws;

        const pingInterval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send('ping');
          }
        }, 30000);

        return () => {
          clearInterval(pingInterval);
        };

      } catch (error) {
        console.error('[WS] Connection error:', error);
      }
    };

    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [url, onMessage]);

  const sendMessage = (message) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('[WS] Cannot send message, not connected');
    }
  };

  return {
    isConnected,
    lastMessage,
    sendMessage
  };
};

export default useWebSocket;
