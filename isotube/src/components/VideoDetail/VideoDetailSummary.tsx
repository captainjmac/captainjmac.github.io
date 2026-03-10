import type {Video} from '@/types';
import {useVideoDescription} from '@/hooks/useVideoDescription';
import {CalendarIcon} from '@/components/common/icons/CalendarIcon';
import {NotesIcon} from '@/components/common/icons/NotesIcon';
import {DescriptionIcon} from '@/components/common/icons/DescriptionIcon';
import {StarIcon} from '@/components/common/icons/StarIcon';
import {VideoActionsDropdown} from '@/components/common/VideoActionsDropdown';

interface VideoDetailSummaryProps {
  video: Video | null;
  onUpdate?: (updates: Partial<Video>) => void;
  onDelete?: () => void;
}

function ReadOnlyStars({rating}: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={star <= rating ? 'text-yellow-400' : 'text-gray-600'}
        >
          <StarIcon className="w-4 h-4" />
        </span>
      ))}
    </div>
  );
}

function formatUploadDate(dateStr: string | undefined): string | null {
  if (!dateStr) return null;
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return null;
  }
}

export function VideoDetailSummary({video, onUpdate, onDelete}: VideoDetailSummaryProps) {
  const {description, isLoading} = useVideoDescription(video?.id ?? null);

  if (!video) {
    return null;
  }

  const uploadDate = formatUploadDate(video.uploadDate);
  const hasRating = video.rating > 0;
  const hasNotes = video.notes && video.notes.trim().length > 0;
  const hasDescription = description.trim().length > 0;

  return (
    <div className="p-4 space-y-4 text-sm overflow-y-auto min-h-0">
      {/* Meta row: upload date, rating, and actions */}
      <div className="flex flex-wrap items-center gap-4 text-gray-400">
        {uploadDate && (
          <div className="flex items-center gap-1.5">
            <CalendarIcon className="w-4 h-4" />
            <span>{uploadDate}</span>
          </div>
        )}
        {hasRating && (
          <div className="flex items-center gap-1.5">
            <ReadOnlyStars rating={video.rating}/>
          </div>
        )}
        {onUpdate && onDelete && (
          <div className="ml-auto">
            <VideoActionsDropdown
              video={video}
              onUpdate={onUpdate}
              onDelete={onDelete}
            />
          </div>
        )}
      </div>

      {/* User notes */}
      {hasNotes && (
        <div className="rounded-lg bg-gray-800/50 border border-gray-700 p-3">
          <div className="flex items-center gap-1.5 text-xs font-medium text-gray-400 mb-2">
            <NotesIcon className="w-3.5 h-3.5" />
            <span>Your Notes</span>
          </div>
          <p className="text-gray-300 whitespace-pre-wrap">{video.notes}</p>
        </div>
      )}

      {/* Video description */}
      {isLoading && (
        <p className="text-gray-500 italic">Loading description...</p>
      )}
      {!isLoading && hasDescription && (
        <div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-gray-400 mb-2">
            <DescriptionIcon className="w-3.5 h-3.5" />
            <span>Description</span>
          </div>
          <p className="text-gray-400 whitespace-pre-wrap leading-relaxed">
            {description}
          </p>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !uploadDate && !hasRating && !hasNotes && !hasDescription && (
        <p className="text-gray-500 italic">No additional details available.</p>
      )}
    </div>
  );
}