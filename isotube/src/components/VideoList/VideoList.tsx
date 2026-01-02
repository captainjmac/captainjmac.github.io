import {useMemo, useState} from 'react';
import type {VideoStatus} from '../../types';
import {VideoCard} from './VideoCard';
import {AddVideoForm} from './AddVideoForm';
import {VideoDetail} from '../VideoDetail/VideoDetail';
import {usePlaylistsContext} from "../../hooks/PlaylistsContext.tsx";
import {PlaylistIcon} from "../common/icons/PlaylistIcon.tsx";
import {EmptyVideoListIcon} from "../common/icons/EmptyVideoListIcon.tsx";

type SortOption = 'added' | 'title' | 'rating' | 'status' | 'uploaded';
type FilterStatus = 'all' | VideoStatus;

interface VideoListProps {
}

const statusOrder: Record<VideoStatus, number> = {
    in_progress: 0,
    unwatched: 1,
    completed: 2,
};

export function VideoList({}: VideoListProps) {

    const {
        activePlaylist,
        currentVideo,
        setCurrentVideo,
        addVideo,
        updateVideo,
        deleteVideo,
    } = usePlaylistsContext();

    const [sortBy, setSortBy] = useState<SortOption>('added');
    const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
    const [detailVideoId, setDetailVideoId] = useState<string | null>(null);

    const currentVideoId = currentVideo?.id ?? null;
    const playlist = activePlaylist;

    if (!playlist) {
        return (
            <div className="flex-1 flex items-center justify-center p-4">
                <div className="text-center">
                    <PlaylistIcon/>
                    <p className="text-gray-400 mb-2">No playlist selected</p>
                    <p className="text-gray-500 text-sm">Create or select a playlist from the sidebar</p>
                </div>
            </div>
        );
    }

    // Filter and sort videos
    const filteredVideos = useMemo(() => {
        let videos = [...playlist.videos];

        // Filter
        if (filterStatus !== 'all') {
            videos = videos.filter(v => v.status === filterStatus);
        }

        // Sort
        videos.sort((a, b) => {
            switch (sortBy) {
                case 'title':
                    return a.title.localeCompare(b.title);
                case 'rating':
                    return b.rating - a.rating;
                case 'status':
                    return statusOrder[a.status] - statusOrder[b.status];
                case 'uploaded':
                    // Sort by upload date (newest first), videos without upload date go to end
                    if (!a.uploadDate && !b.uploadDate) return 0;
                    if (!a.uploadDate) return 1;
                    if (!b.uploadDate) return -1;
                    return new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime();
                case 'added':
                default:
                    return b.addedAt - a.addedAt;
            }
        });

        return videos;
    }, [playlist.videos, sortBy, filterStatus]);

    const detailVideo = detailVideoId
        ? playlist.videos.find(v => v.id === detailVideoId) ?? null
        : null;

    const counts = useMemo(() => ({
        all: playlist.videos.length,
        unwatched: playlist.videos.filter(v => v.status === 'unwatched').length,
        in_progress: playlist.videos.filter(v => v.status === 'in_progress').length,
        completed: playlist.videos.filter(v => v.status === 'completed').length,
    }), [playlist.videos]);

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header with playlist name and add form */}
            <div className="p-4 border-b border-gray-700">
                <h2 className="text-lg font-semibold mb-3">{playlist.name}</h2>
                <AddVideoForm onAddVideo={(video) => addVideo(activePlaylist.id, video)}/>
            </div>

            {/* Filter and sort controls */}
            {playlist.videos.length > 0 && (
                <div className="px-4 py-3 border-b border-gray-700 flex flex-wrap gap-3 items-center">
                    {/* Status filter tabs */}
                    <div className="flex gap-1 bg-gray-800 rounded-lg p-1">
                        {([
                            {value: 'all', label: 'All'},
                            {value: 'unwatched', label: 'Unwatched'},
                            {value: 'in_progress', label: 'In Progress'},
                            {value: 'completed', label: 'Completed'},
                        ] as const).map((option) => (
                            <button
                                key={option.value}
                                onClick={() => setFilterStatus(option.value)}
                                className={`px-3 py-1 rounded text-sm transition-colors ${
                                    filterStatus === option.value
                                        ? 'bg-gray-600 text-white'
                                        : 'text-gray-400 hover:text-white'
                                }`}
                            >
                                {option.label}
                                <span className="ml-1 text-xs opacity-60">
                                    ({counts[option.value]})
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Sort dropdown */}
                    <div className="ml-auto flex items-center gap-2">
                        <span className="text-sm text-gray-400">Sort:</span>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as SortOption)}
                            className="bg-gray-700 text-sm rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="added">Recently Added</option>
                            <option value="uploaded">Upload Date</option>
                            <option value="title">Title</option>
                            <option value="rating">Rating</option>
                            <option value="status">Status</option>
                        </select>
                    </div>
                </div>
            )}

            {/* Video list */}
            <div className="flex-1 overflow-auto p-4">
                {playlist.videos.length === 0 ? (
                    <div className="text-center py-12">
                        <EmptyVideoListIcon/>
                        <p className="text-gray-400 mb-2">No videos in this playlist</p>
                        <p className="text-gray-500 text-sm">Paste a YouTube URL above to add your first video</p>
                    </div>
                ) : filteredVideos.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-400">No videos match this filter</p>
                    </div>
                ) : (
                    <div className="grid gap-3">
                        {filteredVideos.map((video) => (
                            <VideoCard
                                key={video.id}
                                video={video}
                                isPlaying={video.id === currentVideoId}
                                onSelect={() => setCurrentVideo(video.id)}
                                onUpdate={(updates) => updateVideo(playlist.id, video.id, updates)}
                                onDelete={() => deleteVideo(playlist.id, video.id)}
                                onShowDetail={() => setDetailVideoId(video.id)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Video detail modal */}
            {detailVideo && (
                <VideoDetail
                    video={detailVideo}
                    onUpdate={(updates) => updateVideo(playlist.id, detailVideo.id, updates)}
                    onClose={() => setDetailVideoId(null)}
                />
            )}
        </div>
    );
}
