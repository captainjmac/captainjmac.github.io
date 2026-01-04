import { useState } from 'react';
import type { Playlist, Video } from '@/types';
import {
    createVideoFromUrl,
    extractVideoId,
    isPlaylistUrl,
    fetchPlaylistForImport,
    type PlaylistImportResult
} from '@/utils/youtube';
import { PlaylistImportDialog } from './PlaylistImportDialog';

interface AddVideoFormProps {
    onAddVideo: (video: Omit<Video, 'addedAt'>) => void;
    onAddVideos: (playlistId: string, videos: Omit<Video, 'addedAt'>[]) => void;
    onCreatePlaylistWithVideos: (name: string, videos: Omit<Video, 'addedAt'>[]) => void;
    existingPlaylists: Playlist[];
    currentPlaylistId: string | null;
}

export function AddVideoForm({
    onAddVideo,
    onAddVideos,
    onCreatePlaylistWithVideos,
    existingPlaylists,
    currentPlaylistId,
}: AddVideoFormProps) {
    const [url, setUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Playlist import state
    const [showPlaylistImportDialog, setShowPlaylistImportDialog] = useState(false);
    const [playlistImportData, setPlaylistImportData] = useState<PlaylistImportResult | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        const trimmedUrl = url.trim();
        if (!trimmedUrl) return;

        // Check if it's a playlist URL
        if (isPlaylistUrl(trimmedUrl)) {
            setIsLoading(true);
            try {
                const importData = await fetchPlaylistForImport(trimmedUrl);
                if (importData && importData.videos.length > 0) {
                    setPlaylistImportData(importData);
                    setShowPlaylistImportDialog(true);
                    setUrl('');
                } else {
                    setError('Could not fetch playlist or playlist is empty');
                }
            } catch (err) {
                setError('Failed to fetch playlist');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
            return;
        }

        // Regular single video logic
        const videoId = extractVideoId(trimmedUrl);
        if (!videoId) {
            setError('Invalid YouTube URL');
            return;
        }

        setIsLoading(true);
        try {
            const video = await createVideoFromUrl(trimmedUrl);
            if (video) {
                onAddVideo(video);
                setUrl('');
            } else {
                setError('Could not fetch video information');
            }
        } catch (err) {
            setError('Failed to add video');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePaste = async (e: React.ClipboardEvent) => {
        const pastedText = e.clipboardData.getData('text');

        // Check for playlist URL first
        if (isPlaylistUrl(pastedText) && !url) {
            e.preventDefault();
            setUrl(pastedText);
            setError(null);
            setIsLoading(true);

            try {
                const importData = await fetchPlaylistForImport(pastedText);
                if (importData && importData.videos.length > 0) {
                    setPlaylistImportData(importData);
                    setShowPlaylistImportDialog(true);
                    setUrl('');
                } else {
                    setError('Could not fetch playlist or playlist is empty');
                }
            } catch (err) {
                setError('Failed to fetch playlist');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
            return;
        }

        // Regular video paste logic
        const videoId = extractVideoId(pastedText);
        if (videoId && !url) {
            e.preventDefault();
            setUrl(pastedText);
            setError(null);
            setIsLoading(true);

            try {
                const video = await createVideoFromUrl(pastedText);
                if (video) {
                    onAddVideo(video);
                    setUrl('');
                } else {
                    setError('Could not fetch video information');
                }
            } catch (err) {
                setError('Failed to add video');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleImportToNew = (playlistName: string, videos: Omit<Video, 'addedAt'>[]) => {
        onCreatePlaylistWithVideos(playlistName, videos);
    };

    const handleImportToExisting = (playlistId: string, videos: Omit<Video, 'addedAt'>[]) => {
        onAddVideos(playlistId, videos);
    };

    return (
        <>
            <form onSubmit={handleSubmit} className="relative">
                <div className="flex gap-2">
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            value={url}
                            onChange={(e) => {
                                setUrl(e.target.value);
                                setError(null);
                            }}
                            onPaste={handlePaste}
                            placeholder="Paste YouTube URL or playlist..."
                            disabled={isLoading}
                            className={`w-full px-4 py-2 pr-10 bg-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 ${
                                error ? 'ring-2 ring-red-500' : ''
                            }`}
                        />
                        {isLoading && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                <svg className="w-5 h-5 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                    />
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    />
                                </svg>
                            </div>
                        )}
                    </div>
                    <button
                        type="submit"
                        disabled={isLoading || !url.trim()}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"
                    >
                        Add
                    </button>
                </div>

                {error && (
                    <p className="mt-2 text-sm text-red-400">{error}</p>
                )}

                <p className="mt-2 text-xs text-gray-500">
                    Supports youtube.com, youtu.be, YouTube Shorts, and playlist URLs
                </p>
            </form>

            {playlistImportData && (
                <PlaylistImportDialog
                    open={showPlaylistImportDialog}
                    onOpenChange={setShowPlaylistImportDialog}
                    importData={playlistImportData}
                    existingPlaylists={existingPlaylists}
                    currentPlaylistId={currentPlaylistId}
                    onImportToNew={handleImportToNew}
                    onImportToExisting={handleImportToExisting}
                />
            )}
        </>
    );
}
