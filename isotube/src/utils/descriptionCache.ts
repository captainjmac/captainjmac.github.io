const CACHE_KEY = 'isotube-description-cache';
const MAX_ENTRIES = 20;

interface CacheEntry {
    videoId: string;
    description: string;
}

function readCache(): CacheEntry[] {
    try {
        const raw = localStorage.getItem(CACHE_KEY);
        if (!raw) return [];
        return JSON.parse(raw) as CacheEntry[];
    } catch {
        return [];
    }
}

function writeCache(entries: CacheEntry[]): void {
    localStorage.setItem(CACHE_KEY, JSON.stringify(entries));
}

export function getCachedDescription(videoId: string): string | null {
    const entries = readCache();
    const index = entries.findIndex(e => e.videoId === videoId);
    if (index === -1) return null;

    // Move hit to front (LRU)
    const [entry] = entries.splice(index, 1);
    entries.unshift(entry);
    writeCache(entries);

    return entry.description;
}

export function setCachedDescription(videoId: string, description: string): void {
    const entries = readCache();

    // Remove existing entry if present
    const index = entries.findIndex(e => e.videoId === videoId);
    if (index !== -1) {
        entries.splice(index, 1);
    }

    // Insert at front
    entries.unshift({ videoId, description });

    // Evict tail if over limit
    if (entries.length > MAX_ENTRIES) {
        entries.length = MAX_ENTRIES;
    }

    writeCache(entries);
}
