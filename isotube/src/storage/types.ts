import type { AppState } from '@/types';

export interface StorageAdapter {
    load(): Promise<AppState | null>;
    save(state: AppState): Promise<void>;
}

export interface SyncSettings {
    enabled: boolean;
    supabaseUrl: string;
    supabaseAnonKey: string;
    lastSyncedAt: number | null;
}

export const DEFAULT_SYNC_SETTINGS: SyncSettings = {
    enabled: false,
    supabaseUrl: '',
    supabaseAnonKey: '',
    lastSyncedAt: null,
};
