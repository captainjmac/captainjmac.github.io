import { useState, useEffect, useCallback } from 'react';
import type { SyncSettings } from '@/storage/types';
import { DEFAULT_SYNC_SETTINGS } from '@/storage/types';

const STORAGE_KEY = 'isotube-sync-settings';

export function useSyncSettings() {
    const [settings, setSettings] = useState<SyncSettings>(() => {
        try {
            const stored = window.localStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : DEFAULT_SYNC_SETTINGS;
        } catch {
            return DEFAULT_SYNC_SETTINGS;
        }
    });

    // Persist settings to localStorage
    useEffect(() => {
        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
        } catch (error) {
            console.error('Failed to save sync settings:', error);
        }
    }, [settings]);

    const updateSettings = useCallback((updates: Partial<SyncSettings>) => {
        setSettings(prev => ({ ...prev, ...updates }));
    }, []);

    const clearSettings = useCallback(() => {
        setSettings(DEFAULT_SYNC_SETTINGS);
    }, []);

    const setEnabled = useCallback((enabled: boolean) => {
        updateSettings({ enabled });
    }, [updateSettings]);

    const setCredentials = useCallback((supabaseUrl: string, supabaseAnonKey: string) => {
        updateSettings({ supabaseUrl, supabaseAnonKey });
    }, [updateSettings]);

    const setLastSyncedAt = useCallback((timestamp: number | null) => {
        updateSettings({ lastSyncedAt: timestamp });
    }, [updateSettings]);

    const hasCredentials = settings.supabaseUrl.length > 0 && settings.supabaseAnonKey.length > 0;

    return {
        settings,
        updateSettings,
        clearSettings,
        setEnabled,
        setCredentials,
        setLastSyncedAt,
        hasCredentials,
    };
}
