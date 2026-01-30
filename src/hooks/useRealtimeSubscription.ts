import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

export type ConnectionStatus = 'connected' | 'disconnected' | 'reconnecting';

export interface RealtimePayload {
    eventType: 'INSERT' | 'UPDATE' | 'DELETE';
    new: Record<string, any>;
    old: Record<string, any>;
    errors: string[] | null;
}

export interface RealtimeSubscriptionOptions {
    table: string;
    schema?: string;
    event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
    onInsert?: (payload: RealtimePayload) => void;
    onUpdate?: (payload: RealtimePayload) => void;
    onDelete?: (payload: RealtimePayload) => void;
    onAny?: (payload: RealtimePayload) => void;
    onConnectionChange?: (status: ConnectionStatus) => void;
    enableHeartbeat?: boolean;
    heartbeatInterval?: number; // milliseconds
    maxReconnectDelay?: number; // milliseconds
}

interface UseRealtimeSubscriptionReturn {
    status: ConnectionStatus;
    reconnect: () => void;
    disconnect: () => void;
    lastUpdate: Date | null;
}

export function useRealtimeSubscription(
    options: RealtimeSubscriptionOptions
): UseRealtimeSubscriptionReturn {
    const {
        table,
        schema = 'public',
        event = '*',
        onInsert,
        onUpdate,
        onDelete,
        onAny,
        onConnectionChange,
        enableHeartbeat = true,
        heartbeatInterval = 30000, // 30 seconds
        maxReconnectDelay = 30000, // 30 seconds
    } = options;

    const [status, setStatus] = useState<ConnectionStatus>('disconnected');
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

    const channelRef = useRef<RealtimeChannel | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const reconnectAttemptsRef = useRef(0);
    const isManualDisconnectRef = useRef(false);
    const lastHeartbeatRef = useRef<Date>(new Date());

    // Calculate exponential backoff delay
    const getReconnectDelay = useCallback(() => {
        const baseDelay = 1000; // 1 second
        const delay = Math.min(
            baseDelay * Math.pow(2, reconnectAttemptsRef.current),
            maxReconnectDelay
        );
        return delay;
    }, [maxReconnectDelay]);

    // Update connection status
    const updateStatus = useCallback(
        (newStatus: ConnectionStatus) => {
            setStatus(newStatus);
            onConnectionChange?.(newStatus);
            console.debug(`[Realtime:${table}] Status: ${newStatus}`);
        },
        [table, onConnectionChange]
    );

    // Heartbeat mechanism to detect stale connections
    const startHeartbeat = useCallback(() => {
        if (!enableHeartbeat) return;

        if (heartbeatIntervalRef.current) {
            clearInterval(heartbeatIntervalRef.current);
        }

        heartbeatIntervalRef.current = setInterval(() => {
            const now = new Date();
            const timeSinceLastUpdate = now.getTime() - lastHeartbeatRef.current.getTime();

            // If no updates for 2x heartbeat interval, consider connection stale
            if (timeSinceLastUpdate > heartbeatInterval * 2) {
                console.warn(`[Realtime:${table}] Stale connection detected, reconnecting...`);
                reconnect();
            }
        }, heartbeatInterval);
    }, [enableHeartbeat, heartbeatInterval, table]);

    // Stop heartbeat
    const stopHeartbeat = useCallback(() => {
        if (heartbeatIntervalRef.current) {
            clearInterval(heartbeatIntervalRef.current);
            heartbeatIntervalRef.current = null;
        }
    }, []);

    // Subscribe to realtime changes
    const subscribe = useCallback(() => {
        // Clean up existing channel
        if (channelRef.current) {
            try {
                channelRef.current.unsubscribe();
            } catch (err) {
                console.error(`[Realtime:${table}] Error unsubscribing:`, err);
            }
            channelRef.current = null;
        }

        // Create new channel
        const channelName = `${table}-changes-${Date.now()}`;
        const channel = supabase.channel(channelName);

        // Set up postgres changes listener
        (channel as any).on(
            'postgres_changes',
            {
                event: event,
                schema: schema,
                table: table,
            },
            (payload: RealtimePayload) => {
                console.debug(`[Realtime:${table}] Received event:`, payload.eventType);

                // Update heartbeat
                lastHeartbeatRef.current = new Date();
                setLastUpdate(new Date());

                // Call appropriate handlers
                if (payload.eventType === 'INSERT' && onInsert) {
                    onInsert(payload);
                } else if (payload.eventType === 'UPDATE' && onUpdate) {
                    onUpdate(payload);
                } else if (payload.eventType === 'DELETE' && onDelete) {
                    onDelete(payload);
                }

                // Call generic handler
                if (onAny) {
                    onAny(payload);
                }
            }
        );

        // Subscribe and handle status
        channel.subscribe((subscribeStatus) => {
            console.debug(`[Realtime:${table}] Subscribe status:`, subscribeStatus);

            if (subscribeStatus === 'SUBSCRIBED') {
                reconnectAttemptsRef.current = 0; // Reset reconnect attempts
                updateStatus('connected');
                lastHeartbeatRef.current = new Date();
                startHeartbeat();
            } else if (subscribeStatus === 'CHANNEL_ERROR' || subscribeStatus === 'TIMED_OUT') {
                updateStatus('disconnected');
                stopHeartbeat();

                // Attempt reconnection if not manually disconnected
                if (!isManualDisconnectRef.current) {
                    scheduleReconnect();
                }
            }
        });

        channelRef.current = channel;
    }, [table, schema, event, onInsert, onUpdate, onDelete, onAny, updateStatus, startHeartbeat, stopHeartbeat]);

    // Schedule reconnection with exponential backoff
    const scheduleReconnect = useCallback(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
        }

        const delay = getReconnectDelay();
        reconnectAttemptsRef.current += 1;

        console.debug(
            `[Realtime:${table}] Scheduling reconnect in ${delay}ms (attempt ${reconnectAttemptsRef.current})`
        );

        updateStatus('reconnecting');

        reconnectTimeoutRef.current = setTimeout(() => {
            subscribe();
        }, delay);
    }, [table, getReconnectDelay, updateStatus, subscribe]);

    // Manual reconnect
    const reconnect = useCallback(() => {
        console.debug(`[Realtime:${table}] Manual reconnect triggered`);
        isManualDisconnectRef.current = false;
        reconnectAttemptsRef.current = 0;

        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }

        subscribe();
    }, [table, subscribe]);

    // Manual disconnect
    const disconnect = useCallback(() => {
        console.debug(`[Realtime:${table}] Manual disconnect triggered`);
        isManualDisconnectRef.current = true;

        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }

        stopHeartbeat();

        if (channelRef.current) {
            try {
                channelRef.current.unsubscribe();
            } catch (err) {
                console.error(`[Realtime:${table}] Error during disconnect:`, err);
            }
            channelRef.current = null;
        }

        updateStatus('disconnected');
    }, [table, updateStatus, stopHeartbeat]);

    // Initial subscription
    useEffect(() => {
        subscribe();

        // Cleanup on unmount
        return () => {
            isManualDisconnectRef.current = true;

            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }

            stopHeartbeat();

            if (channelRef.current) {
                try {
                    channelRef.current.unsubscribe();
                } catch (err) {
                    console.error(`[Realtime:${table}] Cleanup error:`, err);
                }
            }
        };
    }, [subscribe, stopHeartbeat, table]);

    return {
        status,
        reconnect,
        disconnect,
        lastUpdate,
    };
}
