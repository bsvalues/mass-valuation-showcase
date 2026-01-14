/**
 * useWebSocket Hook
 * 
 * TerraForge Real-Time Collaboration Client
 * TerraFusion Elite Protocol - Evidence-Based Implementation
 * 
 * Features:
 * - Automatic connection/reconnection
 * - JWT authentication
 * - Event subscription system
 * - Room management
 * - React Query cache invalidation integration
 * - Type-safe event handling
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';

type WebSocketEvent = 
  | 'parcel:updated'
  | 'parcel:deleted'
  | 'calibration:running'
  | 'calibration:completed'
  | 'regression:running'
  | 'regression:completed'
  | 'user:joined'
  | 'user:left'
  | 'audit:logged';

type RoomType = 
  | 'global'
  | 'calibration-studio'
  | 'regression-studio'
  | 'uplink'
  | 'governance';

interface WebSocketEventPayload {
  event: WebSocketEvent;
  data: any;
  userId: string;
  timestamp: string;
}

interface UseWebSocketOptions {
  autoConnect?: boolean;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
}

/**
 * Custom hook for WebSocket connectivity and real-time event handling
 */
export function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    autoConnect = true,
    reconnectionAttempts = 5,
    reconnectionDelay = 1000,
  } = options;

  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  /**
   * Get JWT token from localStorage or session
   */
  const getAuthToken = useCallback(() => {
    // In production, this would come from your auth system
    // For now, we'll use a placeholder
    return localStorage.getItem('auth_token') || '';
  }, []);

  /**
   * Initialize WebSocket connection
   */
  const connect = useCallback(() => {
    if (socketRef.current?.connected) {
      console.log('[WebSocket] Already connected');
      return;
    }

    const token = getAuthToken();
    if (!token) {
      console.warn('[WebSocket] No auth token available, skipping connection');
      setConnectionError('No authentication token');
      return;
    }

    const wsUrl = import.meta.env.VITE_WS_URL || window.location.origin;
    
    socketRef.current = io(wsUrl, {
      auth: { token },
      reconnectionAttempts,
      reconnectionDelay,
      transports: ['websocket', 'polling'],
    });

    const socket = socketRef.current;

    // Connection event handlers
    socket.on('connect', () => {
      console.log('[WebSocket] Connected:', socket.id);
      setIsConnected(true);
      setConnectionError(null);
    });

    socket.on('disconnect', (reason) => {
      console.log('[WebSocket] Disconnected:', reason);
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('[WebSocket] Connection error:', error.message);
      setConnectionError(error.message);
      setIsConnected(false);
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log(`[WebSocket] Reconnected after ${attemptNumber} attempts`);
      setIsConnected(true);
      setConnectionError(null);
    });

    socket.on('reconnect_failed', () => {
      console.error('[WebSocket] Reconnection failed');
      setConnectionError('Reconnection failed');
    });

    // Room confirmation handlers
    socket.on('room:joined', (data) => {
      console.log('[WebSocket] Joined room:', data.room);
    });

    socket.on('room:left', (data) => {
      console.log('[WebSocket] Left room:', data.room);
    });

    // User presence handlers
    socket.on('user:joined', (payload: WebSocketEventPayload) => {
      console.log('[WebSocket] User joined:', payload.data.userEmail);
    });

    socket.on('user:left', (payload: WebSocketEventPayload) => {
      console.log('[WebSocket] User left:', payload.data.userEmail);
    });

  }, [getAuthToken, reconnectionAttempts, reconnectionDelay]);

  /**
   * Disconnect WebSocket
   */
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    }
  }, []);

  /**
   * Join a specific room
   */
  const joinRoom = useCallback((room: RoomType) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('join:room', room);
      console.log(`[WebSocket] Joining room: ${room}`);
    } else {
      console.warn('[WebSocket] Cannot join room: not connected');
    }
  }, []);

  /**
   * Leave a specific room
   */
  const leaveRoom = useCallback((room: RoomType) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('leave:room', room);
      console.log(`[WebSocket] Leaving room: ${room}`);
    }
  }, []);

  /**
   * Subscribe to a WebSocket event
   */
  const subscribe = useCallback((
    event: WebSocketEvent,
    callback: (payload: WebSocketEventPayload) => void
  ) => {
    if (!socketRef.current) {
      console.warn(`[WebSocket] Cannot subscribe to ${event}: not connected`);
      return () => {};
    }

    socketRef.current.on(event, callback);
    console.log(`[WebSocket] Subscribed to ${event}`);

    // Return unsubscribe function
    return () => {
      if (socketRef.current) {
        socketRef.current.off(event, callback);
        console.log(`[WebSocket] Unsubscribed from ${event}`);
      }
    };
  }, []);

  /**
   * Subscribe to parcel updates and invalidate React Query cache
   */
  const subscribeToParcelUpdates = useCallback(() => {
    return subscribe('parcel:updated', (payload) => {
      console.log('[WebSocket] Parcel updated:', payload.data);
      // Invalidate parcels query to refetch data
      queryClient.invalidateQueries({ queryKey: ['parcels'] });
    });
  }, [subscribe, queryClient]);

  /**
   * Subscribe to calibration events
   */
  const subscribeToCalibration = useCallback((
    onRunning?: (payload: WebSocketEventPayload) => void,
    onCompleted?: (payload: WebSocketEventPayload) => void
  ) => {
    const unsubRunning = onRunning ? subscribe('calibration:running', onRunning) : () => {};
    const unsubCompleted = onCompleted ? subscribe('calibration:completed', onCompleted) : () => {};

    return () => {
      unsubRunning();
      unsubCompleted();
    };
  }, [subscribe]);

  /**
   * Subscribe to regression events
   */
  const subscribeToRegression = useCallback((
    onRunning?: (payload: WebSocketEventPayload) => void,
    onCompleted?: (payload: WebSocketEventPayload) => void
  ) => {
    const unsubRunning = onRunning ? subscribe('regression:running', onRunning) : () => {};
    const unsubCompleted = onCompleted ? subscribe('regression:completed', onCompleted) : () => {};

    return () => {
      unsubRunning();
      unsubCompleted();
    };
  }, [subscribe]);

  /**
   * Subscribe to audit log events
   */
  const subscribeToAuditLogs = useCallback(() => {
    return subscribe('audit:logged', (payload) => {
      console.log('[WebSocket] Audit log:', payload.data);
      // Invalidate audit logs query
      queryClient.invalidateQueries({ queryKey: ['auditLogs'] });
    });
  }, [subscribe, queryClient]);

  // Auto-connect on mount if enabled
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  return {
    isConnected,
    connectionError,
    connect,
    disconnect,
    joinRoom,
    leaveRoom,
    subscribe,
    subscribeToParcelUpdates,
    subscribeToCalibration,
    subscribeToRegression,
    subscribeToAuditLogs,
  };
}

/**
 * Hook for subscribing to specific room events
 */
export function useWebSocketRoom(room: RoomType) {
  const { joinRoom, leaveRoom, isConnected } = useWebSocket();

  useEffect(() => {
    if (isConnected) {
      joinRoom(room);
    }

    return () => {
      if (isConnected) {
        leaveRoom(room);
      }
    };
  }, [room, isConnected, joinRoom, leaveRoom]);
}
