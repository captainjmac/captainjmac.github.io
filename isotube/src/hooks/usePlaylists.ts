import {useCallback} from 'react';
import {useLocalStorage} from './useLocalStorage';
import type {Playlist, Video, VideoStatus, AppState} from '../types';

const generateId = () => crypto.randomUUID();

const DEFAULT_STATE: AppState = {
    playlists: [],
    activePlaylistId: null,
    currentVideoId: null,
};

export function usePlaylists() {
    const [state, setState] = useLocalStorage<AppState>('isotube-state', DEFAULT_STATE);

    // Get active playlist
    const activePlaylist = state.playlists.find(p => p.id === state.activePlaylistId) ?? null;

    // Get current video
    const currentVideo = activePlaylist?.videos.find(v => v.id === state.currentVideoId) ?? null;

    // Playlist CRUD
    const createPlaylist = useCallback((name: string) => {
        const newPlaylist: Playlist = {
            id: generateId(),
            name,
            videos: [],
            createdAt: Date.now(),
        };
        setState(prev => ({
            ...prev,
            playlists: [...prev.playlists, newPlaylist],
            activePlaylistId: prev.activePlaylistId ?? newPlaylist.id,
        }));
        return newPlaylist.id;
    }, [setState]);

    const renamePlaylist = useCallback((id: string, name: string) => {
        setState(prev => ({
            ...prev,
            playlists: prev.playlists.map(p =>
                p.id === id ? {...p, name} : p
            ),
        }));
    }, [setState]);

    const deletePlaylist = useCallback((id: string) => {
        setState(prev => {
            const newPlaylists = prev.playlists.filter(p => p.id !== id);
            return {
                ...prev,
                playlists: newPlaylists,
                activePlaylistId: prev.activePlaylistId === id
                    ? (newPlaylists[0]?.id ?? null)
                    : prev.activePlaylistId,
                currentVideoId: prev.activePlaylistId === id ? null : prev.currentVideoId,
            };
        });
    }, [setState]);

    const setActivePlaylist = useCallback((id: string | null) => {
        setState(prev => ({
            ...prev,
            activePlaylistId: id,
            currentVideoId: null,
        }));
    }, [setState]);

    // Video CRUD
    const addVideo = useCallback((playlistId: string|null, video: Omit<Video, 'addedAt'>) => {
            const newVideo: Video = {
                ...video,
                addedAt: Date.now(),
            };
            setState(prev => ({
                ...prev,
                playlists: prev.playlists.map(p =>
                    p.id === playlistId
                        ? {...p, videos: [...p.videos, newVideo]}
                        : p
                ),
            }));
    }, [setState]);

    const updateVideo = useCallback((playlistId: string | null, videoId: string, updates: Partial<Video>) => {
        setState(prev => ({
            ...prev,
            playlists: prev.playlists.map(p =>
                p.id === playlistId
                    ? {
                        ...p,
                        videos: p.videos.map(v =>
                            v.id === videoId ? {...v, ...updates} : v
                        ),
                    }
                    : p
            ),
        }));
    }, [setState]);

    const deleteVideo = useCallback((playlistId: string | null, videoId: string) => {
        setState(prev => ({
            ...prev,
            playlists: prev.playlists.map(p =>
                p.id === playlistId
                    ? {...p, videos: p.videos.filter(v => v.id !== videoId)}
                    : p
            ),
            currentVideoId: prev.currentVideoId === videoId ? null : prev.currentVideoId,
        }));
    }, [setState]);

    const moveVideo = useCallback((fromPlaylistId: string, toPlaylistId: string, videoId: string) => {
        setState(prev => {
            const fromPlaylist = prev.playlists.find(p => p.id === fromPlaylistId);
            const video = fromPlaylist?.videos.find(v => v.id === videoId);
            if (!video) return prev;

            return {
                ...prev,
                playlists: prev.playlists.map(p => {
                    if (p.id === fromPlaylistId) {
                        return {...p, videos: p.videos.filter(v => v.id !== videoId)};
                    }
                    if (p.id === toPlaylistId) {
                        return {...p, videos: [...p.videos, video]};
                    }
                    return p;
                }),
            };
        });
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
        setState(prev => ({
            ...prev,
            currentVideoId: videoId,
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

    return {
        // State
        playlists: state.playlists,
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
        updateVideo,
        deleteVideo,
        moveVideo,

        // Video helpers
        setVideoStatus,
        setVideoProgress,
        setVideoRating,
        setVideoNotes,

        // Player controls
        setCurrentVideo,
        playNext,
        playPrevious,
    };
}
