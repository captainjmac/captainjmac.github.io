import { useState, useEffect, useCallback } from 'react';
import type { Video, VideoStatus } from '../../types';
import { StarRating } from './StarRating';

interface VideoDetailProps {
  video: Video;
  onUpdate: (updates: Partial<Video>) => void;
  onClose: () => void;
}

const statusOptions: { value: VideoStatus; label: string; color: string }[] = [
  { value: 'unwatched', label: 'Unwatched', color: 'bg-gray-500' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-yellow-500' },
  { value: 'completed', label: 'Completed', color: 'bg-green-500' },
];

export function VideoDetail({ video, onUpdate, onClose }: VideoDetailProps) {
  const [notes, setNotes] = useState(video.notes);
  const [isSaving, setIsSaving] = useState(false);

  // Update local notes when video changes
  useEffect(() => {
    setNotes(video.notes);
  }, [video.id, video.notes]);

  // Auto-save notes with debounce
  useEffect(() => {
    if (notes === video.notes) return;

    setIsSaving(true);
    const timeout = setTimeout(() => {
      onUpdate({ notes });
      setIsSaving(false);
    }, 500);

    return () => clearTimeout(timeout);
  }, [notes, video.notes, onUpdate]);

  const handleRatingChange = useCallback((rating: number) => {
    onUpdate({ rating });
  }, [onUpdate]);

  const handleStatusChange = useCallback((status: VideoStatus) => {
    onUpdate({ status });
  }, [onUpdate]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative bg-gray-800 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-start gap-4 p-4 border-b border-gray-700">
          <img
            src={video.thumbnail}
            alt={video.title}
            className="w-32 aspect-video rounded object-cover flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-lg line-clamp-2">{video.title}</h2>
            <a
              href={video.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-400 hover:text-blue-300 mt-1 inline-block"
            >
              Open on YouTube
            </a>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-700 transition-colors flex-shrink-0"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 space-y-6">
          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Rating
            </label>
            <StarRating
              rating={video.rating}
              onChange={handleRatingChange}
              size="lg"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Status
            </label>
            <div className="flex gap-2">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleStatusChange(option.value)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                    video.status === option.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${option.color}`} />
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-400">
                Notes
              </label>
              {isSaving && (
                <span className="text-xs text-gray-500">Saving...</span>
              )}
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add your notes here..."
              rows={6}
              className="w-full px-3 py-2 bg-gray-700 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Metadata */}
          <div className="text-xs text-gray-500 space-y-1">
            <p>Added: {new Date(video.addedAt).toLocaleDateString()}</p>
            {video.progress > 0 && (
              <p>Last position: {Math.floor(video.progress / 60)}:{String(Math.floor(video.progress % 60)).padStart(2, '0')}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
