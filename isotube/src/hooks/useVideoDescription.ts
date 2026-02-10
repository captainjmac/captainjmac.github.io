import {useState, useEffect} from 'react';
import {getCachedDescription, setCachedDescription} from '@/utils/descriptionCache';
import {fetchVideoMetadataFromAPI} from '@/utils/youtube';

export function useVideoDescription(videoId: string | null): { description: string; isLoading: boolean } {
    const [description, setDescription] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!videoId) {
            setDescription('');
            setIsLoading(false);
            return;
        }

        // Check cache first
        const cached = getCachedDescription(videoId);
        if (cached !== null) {
            setDescription(cached);
            setIsLoading(false);
            return;
        }

        // Cache miss — fetch from API
        let cancelled = false;
        setIsLoading(true);

        fetchVideoMetadataFromAPI(videoId).then(metadata => {
            if (cancelled) return;
            const desc = metadata?.description ?? '';
            setCachedDescription(videoId, desc);
            setDescription(desc);
            setIsLoading(false);
        });

        return () => {
            cancelled = true;
        };
    }, [videoId]);

    return { description, isLoading };
}
