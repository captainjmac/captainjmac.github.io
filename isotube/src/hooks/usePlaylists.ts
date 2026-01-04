import {useCallback, useMemo} from 'react';
import {produce} from 'immer';
import {useLocalStorage} from './useLocalStorage';
import type {Playlist, Video, VideoStatus, AppState, Subscription, SidebarView} from '@/types';
import type {ChannelMetadata} from '@/utils/youtube';

const generateId = () => crypto.randomUUID();

const DEFAULT_STATE: AppState = {
    playlists: [],
    subscriptions: [],
    activePlaylistId: null,
    activeSubscriptionId: null,
    currentVideoId: null,
    sidebarView: 'playlists',
};

// Migrate state from older versions that don't have subscription fields
function migrateState(state: Partial<AppState>): AppState {
    return {
        playlists: state.playlists ?? [],
        subscriptions: state.subscriptions ?? [],
        activePlaylistId: state.activePlaylistId ?? null,
        activeSubscriptionId: state.activeSubscriptionId ?? null,
        currentVideoId: state.currentVideoId ?? null,
        sidebarView: state.sidebarView ?? 'playlists',
    };
}

export function usePlaylists() {
    const [rawState, setRawState] = useLocalStorage<AppState>('isotube-state', DEFAULT_STATE);

    // Apply migration for backwards compatibility
    const state = useMemo(() => migrateState(rawState), [rawState]);

    // Wrap setState to ensure migration runs before produce updates
    // This handles the case where localStorage has old state without new fields
    const setState = useCallback((updater: (prev: AppState) => AppState) => {
        setRawState((prev) => updater(migrateState(prev)));
    }, [setRawState]);

    // Get active playlist
    const activePlaylist = state.playlists.find(p => p.id === state.activePlaylistId) ?? null;

    // Get current video
    const currentVideo = activePlaylist?.videos.find(v => v.id === state.currentVideoId) ?? null;

    // Get active subscription
    const activeSubscription = state.subscriptions.find(s => s.id === state.activeSubscriptionId) ?? null;

    // Get user-defined playlists (not linked to subscriptions)
    const userPlaylists = useMemo(
        () => state.playlists.filter(p => !p.linkedSubscriptionId),
        [state.playlists]
    );

    // Playlist CRUD
    const createPlaylist = useCallback((name: string) => {
        const newPlaylist: Playlist = {
            id: generateId(),
            name,
            videos: [],
            createdAt: Date.now(),
        };
        setState(produce(draft => {
            draft.playlists.push(newPlaylist);
            draft.activePlaylistId ??= newPlaylist.id;
        }));
        return newPlaylist.id;
    }, [setState]);

    const renamePlaylist = useCallback((id: string, name: string) => {
        setState(produce(draft => {
            const playlist = draft.playlists.find(p => p.id === id);
            if (playlist) playlist.name = name;
        }));
    }, [setState]);

    const deletePlaylist = useCallback((id: string) => {
        setState(produce(draft => {
            const index = draft.playlists.findIndex(p => p.id === id);
            if (index === -1) return;

            draft.playlists.splice(index, 1);

            if (draft.activePlaylistId === id) {
                draft.activePlaylistId = draft.playlists[0]?.id ?? null;
                draft.currentVideoId = null;
            }
        }));
    }, [setState]);

    const setActivePlaylist = useCallback((id: string | null) => {
        setState(produce(draft => {
            draft.activePlaylistId = id;
            draft.currentVideoId = null;
        }));
    }, [setState]);

    // Video CRUD
    const addVideo = useCallback((playlistId: string | null, video: Omit<Video, 'addedAt'>) => {
        const newVideo: Video = {
            ...video,
            addedAt: Date.now(),
        };
        setState(produce(draft => {
            const playlist = draft.playlists.find(p => p.id === playlistId);
            if (playlist) playlist.videos.push(newVideo);
        }));
    }, [setState]);

    const updateVideo = useCallback((playlistId: string | null, videoId: string, updates: Partial<Video>) => {
        setState(produce(draft => {
            const playlist = draft.playlists.find(p => p.id === playlistId);
            const video = playlist?.videos.find(v => v.id === videoId);
            if (video) Object.assign(video, updates);
        }));
    }, [setState]);

    const deleteVideo = useCallback((playlistId: string | null, videoId: string) => {
        setState(produce(draft => {
            const playlist = draft.playlists.find(p => p.id === playlistId);
            if (playlist) {
                const index = playlist.videos.findIndex(v => v.id === videoId);
                if (index !== -1) playlist.videos.splice(index, 1);
            }
            if (draft.currentVideoId === videoId) {
                draft.currentVideoId = null;
            }
        }));
    }, [setState]);

    const moveVideo = useCallback((fromPlaylistId: string, toPlaylistId: string, videoId: string) => {
        setState(produce(draft => {
            const fromPlaylist = draft.playlists.find(p => p.id === fromPlaylistId);
            const toPlaylist = draft.playlists.find(p => p.id === toPlaylistId);
            if (!fromPlaylist || !toPlaylist) return;

            const videoIndex = fromPlaylist.videos.findIndex(v => v.id === videoId);
            if (videoIndex === -1) return;

            const [video] = fromPlaylist.videos.splice(videoIndex, 1);
            toPlaylist.videos.push(video);
        }));
    }, [setState]);

    // Add multiple videos at once, skipping duplicates
    const addVideos = useCallback((playlistId: string | null, videos: Omit<Video, 'addedAt'>[]) => {
        setState(produce(draft => {
            const playlist = draft.playlists.find(p => p.id === playlistId);
            if (playlist) {
                const existingIds = new Set(playlist.videos.map(v => v.id));
                const newVideos = videos
                    .filter(v => !existingIds.has(v.id))
                    .map((video, index) => ({
                        ...video,
                        addedAt: Date.now() + index,
                    }));
                playlist.videos.push(...newVideos);
            }
        }));
    }, [setState]);

    // Create a new playlist pre-populated with videos
    const createPlaylistWithVideos = useCallback((name: string, videos: Omit<Video, 'addedAt'>[]) => {
        const newPlaylistId = generateId();
        const newPlaylist: Playlist = {
            id: newPlaylistId,
            name,
            videos: videos.map((video, index) => ({
                ...video,
                addedAt: Date.now() + index,
            })),
            createdAt: Date.now(),
        };
        setState(produce(draft => {
            draft.playlists.push(newPlaylist);
            draft.activePlaylistId = newPlaylistId;
        }));
        return newPlaylistId;
    }, [setState]);

    // Video status/progress helpers
    const setVideoStatus = useCallback((playlistId: string, videoId: string, status: VideoStatus) => {
        updateVideo(playlistId, videoId, {status});
    }, [updateVideo]);

    const setVideoProgress = useCallback((playlistId: string, videoId: string, progress: number) => {
        updateVideo(playlistId, videoId, {
            progress,
            status: progress > 0 ? 'in_progress' : 'unwatched',
        });
    }, [updateVideo]);

    const setVideoRating = useCallback((playlistId: string, videoId: string, rating: number) => {
        updateVideo(playlistId, videoId, {rating: Math.max(0, Math.min(5, rating))});
    }, [updateVideo]);

    const setVideoNotes = useCallback((playlistId: string, videoId: string, notes: string) => {
        updateVideo(playlistId, videoId, {notes});
    }, [updateVideo]);

    // Player controls
    const setCurrentVideo = useCallback((videoId: string | null) => {
        setState(produce(draft => {
            draft.currentVideoId = videoId;
        }));
    }, [setState]);

    const playNext = useCallback(() => {
        if (!activePlaylist || !state.currentVideoId) return;
        const currentIndex = activePlaylist.videos.findIndex(v => v.id === state.currentVideoId);
        const nextVideo = activePlaylist.videos[currentIndex + 1];
        if (nextVideo) {
            setCurrentVideo(nextVideo.id);
        }
    }, [activePlaylist, state.currentVideoId, setCurrentVideo]);

    const playPrevious = useCallback(() => {
        if (!activePlaylist || !state.currentVideoId) return;
        const currentIndex = activePlaylist.videos.findIndex(v => v.id === state.currentVideoId);
        const prevVideo = activePlaylist.videos[currentIndex - 1];
        if (prevVideo) {
            setCurrentVideo(prevVideo.id);
        }
    }, [activePlaylist, state.currentVideoId, setCurrentVideo]);

    // Import/export state
    const importState = useCallback((newState: AppState) => {
        setState(() => newState);
    }, [setState]);

    const exportState = useCallback((): AppState => {
        return state;
    }, [state]);

    // Subscription CRUD
    const createSubscription = useCallback((
        channelMetadata: ChannelMetadata,
        initialVideos: Omit<Video, 'addedAt'>[]
    ) => {
        const subscriptionId = generateId();
        const playlistId = generateId();

        setState(produce(draft => {
            // Create linked playlist
            const linkedPlaylist: Playlist = {
                id: playlistId,
                name: channelMetadata.title,
                videos: initialVideos.map((video, index) => ({
                    ...video,
                    addedAt: Date.now() + index,
                })),
                createdAt: Date.now(),
                linkedSubscriptionId: subscriptionId,
            };

            // Create subscription
            const newSubscription: Subscription = {
                id: subscriptionId,
                channelId: channelMetadata.id,
                name: channelMetadata.title,
                thumbnail: channelMetadata.thumbnail,
                linkedPlaylistId: playlistId,
                lastRefreshed: Date.now(),
                createdAt: Date.now(),
            };

            draft.subscriptions.push(newSubscription);
            draft.playlists.push(linkedPlaylist);
            draft.activeSubscriptionId = subscriptionId;
            draft.activePlaylistId = playlistId;
            draft.sidebarView = 'subscriptions';
        }));

        return subscriptionId;
    }, [setState]);

    const deleteSubscription = useCallback((subscriptionId: string) => {
        setState(produce(draft => {
            const subscription = draft.subscriptions.find(s => s.id === subscriptionId);
            if (!subscription) return;

            // Remove linked playlist
            const playlistIndex = draft.playlists.findIndex(p => p.id === subscription.linkedPlaylistId);
            if (playlistIndex !== -1) {
                draft.playlists.splice(playlistIndex, 1);
            }

            // Remove subscription
            const subIndex = draft.subscriptions.findIndex(s => s.id === subscriptionId);
            draft.subscriptions.splice(subIndex, 1);

            // Clear active states if needed
            if (draft.activeSubscriptionId === subscriptionId) {
                draft.activeSubscriptionId = draft.subscriptions[0]?.id ?? null;
                draft.activePlaylistId = draft.subscriptions[0]?.linkedPlaylistId ?? null;
            }
            draft.currentVideoId = null;
        }));
    }, [setState]);

    const setActiveSubscription = useCallback((subscriptionId: string | null) => {
        setState(produce(draft => {
            draft.activeSubscriptionId = subscriptionId;
            if (subscriptionId) {
                const subscription = draft.subscriptions.find(s => s.id === subscriptionId);
                draft.activePlaylistId = subscription?.linkedPlaylistId ?? null;
            }
            draft.currentVideoId = null;
        }));
    }, [setState]);

    const refreshSubscription = useCallback((
        subscriptionId: string,
        newVideos: Omit<Video, 'addedAt'>[]
    ) => {
        setState(produce(draft => {
            const subscription = draft.subscriptions.find(s => s.id === subscriptionId);
            if (!subscription) return;

            const playlist = draft.playlists.find(p => p.id === subscription.linkedPlaylistId);
            if (!playlist) return;

            // Add new videos (skip duplicates)
            const existingIds = new Set(playlist.videos.map(v => v.id));
            const videosToAdd = newVideos
                .filter(v => !existingIds.has(v.id))
                .map((video, index) => ({
                    ...video,
                    addedAt: Date.now() + index,
                }));

            // Prepend new videos to beginning
            playlist.videos.unshift(...videosToAdd);
            subscription.lastRefreshed = Date.now();
        }));
    }, [setState]);

    const setSidebarView = useCallback((view: SidebarView) => {
        setState(produce(draft => {
            draft.sidebarView = view;
        }));
    }, [setState]);

    // Get linked playlist for a subscription
    const getSubscriptionPlaylist = useCallback((subscriptionId: string) => {
        const subscription = state.subscriptions.find(s => s.id === subscriptionId);
        if (!subscription) return null;
        return state.playlists.find(p => p.id === subscription.linkedPlaylistId) ?? null;
    }, [state.subscriptions, state.playlists]);

    return {
        // State
        playlists: state.playlists,
        userPlaylists,
        activePlaylist,
        currentVideo,
        activePlaylistId: state.activePlaylistId,
        currentVideoId: state.currentVideoId,

        // Playlist operations
        createPlaylist,
        renamePlaylist,
        deletePlaylist,
        setActivePlaylist,

        // Video operations
        addVideo,
        addVideos,
        updateVideo,
        deleteVideo,
        moveVideo,
        createPlaylistWithVideos,

        // Video helpers
        setVideoStatus,
        setVideoProgress,
        setVideoRating,
        setVideoNotes,

        // Player controls
        setCurrentVideo,
        playNext,
        playPrevious,

        // Import/export
        importState,
        exportState,

        // Subscriptions state
        subscriptions: state.subscriptions,
        activeSubscription,
        activeSubscriptionId: state.activeSubscriptionId,
        sidebarView: state.sidebarView,

        // Subscription operations
        createSubscription,
        deleteSubscription,
        setActiveSubscription,
        refreshSubscription,
        setSidebarView,
        getSubscriptionPlaylist,
    };
}
