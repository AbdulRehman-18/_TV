import { useCallback, useRef, useState } from 'react';

export interface RetryQueueOptions {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    backoffMultiplier?: number;
}

interface QueuedOperation {
    id: string;
    operation: () => Promise<void>;
    retries: number;
    lastAttempt: Date | null;
}

export function useRetryQueue(options: RetryQueueOptions = {}) {
    const {
        maxRetries = 3,
        initialDelay = 1000,
        maxDelay = 30000,
        backoffMultiplier = 2,
    } = options;

    const [pendingCount, setPendingCount] = useState(0);
    const queueRef = useRef<Map<string, QueuedOperation>>(new Map());
    const timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

    // Calculate delay with exponential backoff
    const getDelay = useCallback(
        (retries: number): number => {
            const delay = Math.min(
                initialDelay * Math.pow(backoffMultiplier, retries),
                maxDelay
            );
            return delay;
        },
        [initialDelay, backoffMultiplier, maxDelay]
    );

    // Execute an operation with retry logic
    const executeOperation = useCallback(
        async (id: string) => {
            const operation = queueRef.current.get(id);
            if (!operation) return;

            try {
                console.debug(`[RetryQueue] Executing operation: ${id} (attempt ${operation.retries + 1})`);

                await operation.operation();

                // Success - remove from queue
                queueRef.current.delete(id);
                const timeout = timeoutsRef.current.get(id);
                if (timeout) {
                    clearTimeout(timeout);
                    timeoutsRef.current.delete(id);
                }
                setPendingCount(queueRef.current.size);

                console.debug(`[RetryQueue] Operation succeeded: ${id}`);
            } catch (error) {
                console.error(`[RetryQueue] Operation failed: ${id}`, error);

                operation.lastAttempt = new Date();
                operation.retries += 1;

                if (operation.retries >= maxRetries) {
                    // Max retries reached - remove from queue
                    console.error(`[RetryQueue] Max retries reached for: ${id}`);
                    queueRef.current.delete(id);
                    const timeout = timeoutsRef.current.get(id);
                    if (timeout) {
                        clearTimeout(timeout);
                        timeoutsRef.current.delete(id);
                    }
                    setPendingCount(queueRef.current.size);
                } else {
                    // Schedule retry
                    const delay = getDelay(operation.retries);
                    console.debug(`[RetryQueue] Scheduling retry for ${id} in ${delay}ms`);

                    const timeout = setTimeout(() => {
                        executeOperation(id);
                    }, delay);

                    timeoutsRef.current.set(id, timeout);
                }
            }
        },
        [maxRetries, getDelay]
    );

    // Add operation to queue
    const enqueue = useCallback(
        (id: string, operation: () => Promise<void>) => {
            // Check if operation already exists
            if (queueRef.current.has(id)) {
                console.debug(`[RetryQueue] Operation already queued: ${id}`);
                return;
            }

            console.debug(`[RetryQueue] Enqueueing operation: ${id}`);

            queueRef.current.set(id, {
                id,
                operation,
                retries: 0,
                lastAttempt: null,
            });

            setPendingCount(queueRef.current.size);

            // Execute immediately
            executeOperation(id);
        },
        [executeOperation]
    );

    // Remove operation from queue
    const remove = useCallback((id: string) => {
        const timeout = timeoutsRef.current.get(id);
        if (timeout) {
            clearTimeout(timeout);
            timeoutsRef.current.delete(id);
        }

        queueRef.current.delete(id);
        setPendingCount(queueRef.current.size);

        console.debug(`[RetryQueue] Removed operation: ${id}`);
    }, []);

    // Clear all operations
    const clear = useCallback(() => {
        // Clear all timeouts
        timeoutsRef.current.forEach((timeout) => {
            clearTimeout(timeout);
        });

        timeoutsRef.current.clear();
        queueRef.current.clear();
        setPendingCount(0);

        console.debug('[RetryQueue] Cleared all operations');
    }, []);

    // Retry all failed operations immediately
    const retryAll = useCallback(() => {
        console.debug('[RetryQueue] Retrying all operations');

        queueRef.current.forEach((operation, id) => {
            // Clear existing timeout
            const timeout = timeoutsRef.current.get(id);
            if (timeout) {
                clearTimeout(timeout);
                timeoutsRef.current.delete(id);
            }

            // Reset retries and execute
            operation.retries = 0;
            executeOperation(id);
        });
    }, [executeOperation]);

    return {
        enqueue,
        remove,
        clear,
        retryAll,
        pendingCount,
    };
}
