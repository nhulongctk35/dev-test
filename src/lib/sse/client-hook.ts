"use client";

/**
 * Client-side SSE React Hook
 *
 * Provides a React hook for connecting to and receiving SSE events.
 */

import { useEffect, useRef, useState, useCallback } from "react";

// Simple client-side logger
const log = {
  debug: (message: string, data?: any) =>
    console.debug(`[SSEClientHook] ${message}`, data),
  info: (message: string, data?: any) =>
    console.info(`[SSEClientHook] ${message}`, data),
  warn: (message: string, data?: any) =>
    console.warn(`[SSEClientHook] ${message}`, data),
  error: (message: string, data?: any) =>
    console.error(`[SSEClientHook] ${message}`, data),
};

export interface SSEMessage {
  type: string;
  data: any;
  id?: string;
  timestamp: number;
}

export interface SSEHookOptions {
  url?: string;
  reconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
  onMessage?: (message: SSEMessage) => void;
}

export interface SSEHookReturn {
  isConnected: boolean;
  isConnecting: boolean;
  lastMessage: SSEMessage | null;
  messages: SSEMessage[];
  error: string | null;
  connect: () => void;
  disconnect: () => void;
  clearMessages: () => void;
}

export function useSSE(options: SSEHookOptions = {}): SSEHookReturn {
  const {
    url = "/api/sse",
    reconnect = true,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5,
    onConnect,
    onDisconnect,
    onError,
    onMessage,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [lastMessage, setLastMessage] = useState<SSEMessage | null>(null);
  const [messages, setMessages] = useState<SSEMessage[]>([]);
  const [error, setError] = useState<string | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const shouldReconnectRef = useRef(true);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setLastMessage(null);
  }, []);

  const handleMessage = useCallback(
    (event: MessageEvent) => {
      try {
        let data: any;

        // Try to parse as JSON, fallback to string
        try {
          data = JSON.parse(event.data);
        } catch {
          data = event.data;
        }

        const message: SSEMessage = {
          type: event.type || "message",
          data,
          id: event.lastEventId || undefined,
          timestamp: Date.now(),
        };

        setLastMessage(message);
        setMessages((prev) => [...prev, message]);

        onMessage?.(message);

        log.debug("SSE message received", {
          type: message.type,
          id: message.id,
        });
      } catch (error) {
        log.error("Failed to process SSE message", {
          error,
          rawData: event.data,
        });
      }
    },
    [onMessage],
  );

  const handleOpen = useCallback(() => {
    setIsConnected(true);
    setIsConnecting(false);
    setError(null);
    reconnectAttemptsRef.current = 0;

    onConnect?.();
    log.info("SSE connection established");
  }, [onConnect]);

  const handleError = useCallback(
    (event: Event) => {
      const errorMessage = "SSE connection error";
      setError(errorMessage);
      setIsConnecting(false);

      onError?.(event);
      log.error("SSE connection error", { event });
    },
    [onError],
  );

  const handleClose = useCallback(() => {
    setIsConnected(false);
    setIsConnecting(false);

    onDisconnect?.();
    log.info("SSE connection closed");

    // Attempt reconnection if enabled and we haven't exceeded max attempts
    if (
      reconnect &&
      shouldReconnectRef.current &&
      reconnectAttemptsRef.current < maxReconnectAttempts
    ) {
      reconnectAttemptsRef.current++;

      log.info("Attempting SSE reconnection", {
        attempt: reconnectAttemptsRef.current,
        maxAttempts: maxReconnectAttempts,
      });

      reconnectTimeoutRef.current = setTimeout(() => {
        if (shouldReconnectRef.current) {
          connect();
        }
      }, reconnectInterval);
    }
  }, [reconnect, reconnectInterval, maxReconnectAttempts, onDisconnect]);

  const connect = useCallback(() => {
    // Don't connect if already connected or connecting
    if (
      eventSourceRef.current?.readyState === EventSource.OPEN ||
      isConnecting
    ) {
      return;
    }

    setIsConnecting(true);
    setError(null);
    shouldReconnectRef.current = true;

    try {
      // Close existing connection if any
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;

      // Set up event listeners
      eventSource.onopen = handleOpen;
      eventSource.onerror = handleError;
      eventSource.onmessage = handleMessage;

      // Listen for custom event types
      eventSource.addEventListener("notification", handleMessage);
      eventSource.addEventListener("system", handleMessage);
      eventSource.addEventListener("heartbeat", handleMessage);
      eventSource.addEventListener("connection", handleMessage);

      log.info("SSE connection initiated", { url });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to connect";
      setError(errorMessage);
      setIsConnecting(false);
      log.error("Failed to initiate SSE connection", { error, url });
    }
  }, [url, isConnecting, handleOpen, handleError, handleMessage]);

  const disconnect = useCallback(() => {
    shouldReconnectRef.current = false;

    // Clear reconnection timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Close EventSource
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    setIsConnected(false);
    setIsConnecting(false);

    log.info("SSE connection manually disconnected");
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    connect();

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, []);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  return {
    isConnected,
    isConnecting,
    lastMessage,
    messages,
    error,
    connect,
    disconnect,
    clearMessages,
  };
}
