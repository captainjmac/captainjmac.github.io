import type { AppState } from '@/types';
import type { StorageAdapter } from './types';

const STORAGE_KEY = 'isotube-state';

export class LocalStorageAdapter implements StorageAdapter {
    private key: string;

    constructor(key: string = STORAGE_KEY) {
        this.key = key;
    }

    async load(): Promise<AppState | null> {
        try {
            const item = window.localStorage.getItem(this.key);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            console.error(`Error reading localStorage key "${this.key}":`, error);
            return null;
        }
    }

    async save(state: AppState): Promise<void> {
        try {
            window.localStorage.setItem(this.key, JSON.stringify(state));
        } catch (error) {
            console.error(`Error setting localStorage key "${this.key}":`, error);
            throw error;
        }
    }
}
