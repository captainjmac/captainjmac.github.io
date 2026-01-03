import {useCallback} from 'react';
import {produce} from 'immer';
import {useLocalStorage} from './useLocalStorage';
import type {Playlist, Video, VideoStatus, AppState} from '@/types';

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
        setState(newState);
    }, [setState]);

    const exportState = useCallback((): AppState => {
        return state;
    }, [state]);

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

        // Import/export
        importState,
        exportState,
    };
}
