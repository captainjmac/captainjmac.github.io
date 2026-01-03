import { useState, useEffect, useCallback } from 'react';
import type { Video, VideoStatus } from '@/types';
import { StarRating } from './StarRating';

interface VideoDetailProps {
  video: Video | null;
  onUpdate: (updates: Partial<Video>) => void;
}

const statusOptions: { value: VideoStatus; label: string; color: string }[] = [
  { value: 'unwatched', label: 'Unwatched', color: 'bg-gray-500' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-yellow-500' },
  { value: 'completed', label: 'Completed', color: 'bg-green-500' },
];

export function VideoDetail({ video, onUpdate }: VideoDetailProps) {

  if (!video) {
    return null;
  }

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

  return (<>


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
  </>);
}
