import {memo, useState} from 'react';
import type {Video} from '@/types';
import {VideoActionsDropdown, statusColors, statusLabels} from '@/components/common/VideoActionsDropdown';

interface VideoCardProps {
  video: Video;
  isPlaying: boolean;
  onShowDetail: () => void;
  onPlay: () => void;
  onUpdate: (updates: Partial<Video>) => void;
  onDelete: () => void;
}

export const VideoCard = memo(function VideoCard({
  video,
  isPlaying,
  onShowDetail,
  onPlay,
  onUpdate,
  onDelete,
}: VideoCardProps) {

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(video.title);

  const handleSaveTitle = () => {
    if (editTitle.trim() && editTitle !== video.title) {
      onUpdate({title: editTitle.trim()});
    }
    setIsEditing(false);
  };

  const handleEditTitle = () => setIsEditing(true);

  return (
    <div
      className={`flex gap-3 p-2 rounded-lg cursor-pointer transition-all min-w-0 overflow-hidden ${
        isPlaying
          ? 'bg-blue-600/20 ring-2 ring-blue-500'
          : 'bg-gray-800 hover:bg-gray-750'
      }`}
      onClick={onPlay}
    >
      {/* Thumbnail */}
      <div className="relative flex-shrink-0 w-16 aspect-video rounded overflow-hidden bg-gray-700">
        <img
          src={video.thumbnail}
          alt={video.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        {/* Status indicator */}
        <div
          className={`absolute top-1 left-1 w-2 h-2 rounded-full ${statusColors[video.status]}`}
          title={statusLabels[video.status]}
        />
        {/* Playing indicator */}
        {isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col">
        {isEditing ? (
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleSaveTitle}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveTitle();
              if (e.key === 'Escape') {
                setEditTitle(video.title);
                setIsEditing(false);
              }
            }}
            onClick={(e) => e.stopPropagation()}
            className="px-2 py-1 bg-gray-700 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
        ) : (
          <h3 className="font-medium text-sm line-clamp-2" title={video.title}>
            {video.title}
          </h3>
        )}

        {/* Star + Status badge */}
        <div className="mt-auto pt-2 flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUpdate({ starred: !video.starred });
            }}
            className={`text-sm leading-none hover:scale-110 transition-transform ${
              video.starred ? 'text-yellow-400' : 'text-gray-500 hover:text-gray-400'
            }`}
            title={video.starred ? 'Unstar' : 'Star'}
          >
            {video.starred ? '★' : '☆'}
          </button>
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${
              video.status === 'completed'
                ? 'bg-green-500/20 text-green-400'
                : video.status === 'in_progress'
                  ? 'bg-yellow-500/20 text-yellow-400'
                  : 'bg-gray-500/20 text-gray-400'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${statusColors[video.status]}`}/>
            {statusLabels[video.status]}
          </span>

          {video.uploadDate && (
            <span className="text-xs text-gray-500">
              {new Date(video.uploadDate).toLocaleDateString()}
            </span>
          )}

          {/* Rating stars */}
          {video.rating > 0 && (
            <span className="text-yellow-400 text-xs">
              {'★'.repeat(video.rating)}
              {'☆'.repeat(5 - video.rating)}
            </span>
          )}
        </div>
      </div>

      {/* Menu */}
      <VideoActionsDropdown
        video={video}
        onUpdate={onUpdate}
        onDelete={onDelete}
        onShowDetail={onShowDetail}
        onEditTitle={handleEditTitle}
      />
    </div>
  );
}, (prev, next) => prev.video === next.video && prev.isPlaying === next.isPlaying);
