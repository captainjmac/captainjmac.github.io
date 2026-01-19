import { useState, useEffect, useCallback, useRef } from 'react';
import { SupabaseAdapter } from '@/storage/SupabaseAdapter';
import type { SyncSettings } from '@/storage/types';
import type { AppState } from '@/types';

interface UseCloudSyncOptions {
    settings: SyncSettings;
    currentState: AppState;
    onRemoteStateLoaded: (state: AppState) => void;
    onSyncComplete: (timestamp: number) => void;
}

interface UseCloudSyncResult {
    isConnected: boolean;
    isSyncing: boolean;
    lastSyncedAt: Date | null;
    error: string | null;
    syncNow: () => Promise<void>;
    testConnection: (url: string, anonKey: string) => Promise<{ success: boolean; error?: string }>;
    disconnect: () => Promise<void>;
}

const DEBOUNCE_MS = 2000;

export function useCloudSync({
    settings,
    currentState,
    onRemoteStateLoaded,
    onSyncComplete,
}: UseCloudSyncOptions): UseCloudSyncResult {
    const [isConnected, setIsConnected] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(
        settings.lastSyncedAt ? new Date(settings.lastSyncedAt) : null
    );

    const adapterRef = useRef<SupabaseAdapter | null>(null);
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastSavedStateRef = useRef<string>('');
    const isInitialLoadRef = useRef(true);

    // Store callbacks in refs to avoid triggering re-connections
    const onRemoteStateLoadedRef = useRef(onRemoteStateLoaded);
    const onSyncCompleteRef = useRef(onSyncComplete);
    const lastSyncedAtRef = useRef(settings.lastSyncedAt);

    useEffect(() => {
        onRemoteStateLoadedRef.current = onRemoteStateLoaded;
        onSyncCompleteRef.current = onSyncComplete;
        lastSyncedAtRef.current = settings.lastSyncedAt;
    }, [onRemoteStateLoaded, onSyncComplete, settings.lastSyncedAt]);

    // Create/update adapter when credentials change
    useEffect(() => {
        if (settings.enabled && settings.supabaseUrl && settings.supabaseAnonKey) {
            adapterRef.current = new SupabaseAdapter(
                settings.supabaseUrl,
                settings.supabaseAnonKey
            );
            // Initialize and load remote state
            initializeAndLoad();
        } else {
            adapterRef.current = null;
            setIsConnected(false);
        }

        async function initializeAndLoad() {
            if (!adapterRef.current) return;

            setIsSyncing(true);
            setError(null);

            try {
                const initialized = await adapterRef.current.initialize();
                if (!initialized) {
                    setError('Failed to connect to Supabase');
                    setIsConnected(false);
                    return;
                }

                setIsConnected(true);

                // Load remote state on initial connect
                const remoteState = await adapterRef.current.load();
                if (remoteState) {
                    // Get last sync times
                    const remoteTime = await adapterRef.current.getLastSyncTime();
                    const localTime = lastSyncedAtRef.current
                        ? new Date(lastSyncedAtRef.current)
                        : null;

                    // Last-write-wins: if remote is newer, use it
                    if (remoteTime && (!localTime || remoteTime > localTime)) {
                        onRemoteStateLoadedRef.current(remoteState);
                        lastSavedStateRef.current = JSON.stringify(remoteState);
                    }
                }

                const syncTime = new Date();
                setLastSyncedAt(syncTime);
                onSyncCompleteRef.current(syncTime.getTime());
                isInitialLoadRef.current = false;
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Connection failed');
                setIsConnected(false);
            } finally {
                setIsSyncing(false);
            }
        }

        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, [settings.enabled, settings.supabaseUrl, settings.supabaseAnonKey]);

    // Auto-save on state changes (debounced)
    useEffect(() => {
        if (!isConnected || !adapterRef.current || isInitialLoadRef.current) {
            return;
        }

        const stateString = JSON.stringify(currentState);

        // Skip if state hasn't changed
        if (stateString === lastSavedStateRef.current) {
            return;
        }

        // Debounce saves
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        debounceTimerRef.current = setTimeout(async () => {
            if (!adapterRef.current || !isConnected) return;

            try {
                setIsSyncing(true);
                await adapterRef.current.save(currentState);
                lastSavedStateRef.current = stateString;
                const syncTime = new Date();
                setLastSyncedAt(syncTime);
                onSyncComplete(syncTime.getTime());
                setError(null);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Sync failed');
            } finally {
                setIsSyncing(false);
            }
        }, DEBOUNCE_MS);

        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, [currentState, isConnected, onSyncComplete]);

    // Manual sync
    const syncNow = useCallback(async () => {
        if (!adapterRef.current || !isConnected) {
            setError('Not connected');
            return;
        }

        setIsSyncing(true);
        setError(null);

        try {
            await adapterRef.current.save(currentState);
            lastSavedStateRef.current = JSON.stringify(currentState);
            const syncTime = new Date();
            setLastSyncedAt(syncTime);
            onSyncComplete(syncTime.getTime());
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Sync failed');
        } finally {
            setIsSyncing(false);
        }
    }, [currentState, isConnected, onSyncComplete]);

    // Test connection without fully connecting
    const testConnection = useCallback(
        async (url: string, anonKey: string): Promise<{ success: boolean; error?: string }> => {
            const testAdapter = new SupabaseAdapter(url, anonKey);
            return testAdapter.testConnection();
        },
        []
    );

    // Disconnect
    const disconnect = useCallback(async () => {
        if (adapterRef.current) {
            await adapterRef.current.signOut();
            adapterRef.current = null;
        }
        setIsConnected(false);
        setLastSyncedAt(null);
        setError(null);
    }, []);

    return {
        isConnected,
        isSyncing,
        lastSyncedAt,
        error,
        syncNow,
        testConnection,
        disconnect,
    };
}
