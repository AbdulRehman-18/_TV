import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import type { ConnectionStatus } from '@/hooks/useRealtimeSubscription';

interface ConnectionIndicatorProps {
    status: ConnectionStatus;
    autoHideDelay?: number; // milliseconds, 0 to disable auto-hide
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export function ConnectionIndicator({
    status,
    autoHideDelay = 3000,
    position = 'top-left',
}: ConnectionIndicatorProps) {
    const [isVisible, setIsVisible] = useState(false);
    const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Show indicator when status changes, hide after delay if connected
    useEffect(() => {
        setIsVisible(true);

        // Clear existing timeout
        if (hideTimeoutRef.current) {
            clearTimeout(hideTimeoutRef.current);
            hideTimeoutRef.current = null;
        }

        // Auto-hide only when connected and autoHideDelay is set
        if (status === 'connected' && autoHideDelay > 0) {
            hideTimeoutRef.current = setTimeout(() => {
                setIsVisible(false);
            }, autoHideDelay);
        }

        return () => {
            if (hideTimeoutRef.current) {
                clearTimeout(hideTimeoutRef.current);
            }
        };
    }, [status, autoHideDelay]);

    const positionClasses = {
        'top-left': 'top-6 left-6',
        'top-right': 'top-6 right-6',
        'bottom-left': 'bottom-6 left-6',
        'bottom-right': 'bottom-6 right-6',
    };

    const statusConfig = {
        connected: {
            icon: Wifi,
            text: 'Connected',
            color: 'text-emerald-400',
            bgColor: 'bg-emerald-500/20',
            dotColor: 'bg-emerald-500',
        },
        reconnecting: {
            icon: RefreshCw,
            text: 'Reconnecting...',
            color: 'text-yellow-400',
            bgColor: 'bg-yellow-500/20',
            dotColor: 'bg-yellow-500',
        },
        disconnected: {
            icon: WifiOff,
            text: 'Disconnected',
            color: 'text-red-400',
            bgColor: 'bg-red-500/20',
            dotColor: 'bg-red-500',
        },
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className={`fixed ${positionClasses[position]} z-50`}
                >
                    <div
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg backdrop-blur-md ${config.bgColor} border border-white/10 shadow-lg`}
                    >
                        {/* Status dot */}
                        <div className="relative">
                            <div className={`w-2 h-2 rounded-full ${config.dotColor}`} />
                            {status === 'connected' && (
                                <div
                                    className={`absolute inset-0 w-2 h-2 rounded-full ${config.dotColor} animate-ping`}
                                />
                            )}
                        </div>

                        {/* Icon */}
                        <Icon
                            className={`w-4 h-4 ${config.color} ${status === 'reconnecting' ? 'animate-spin' : ''
                                }`}
                        />

                        {/* Text */}
                        <span className={`text-sm font-medium ${config.color}`}>
                            {config.text}
                        </span>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
