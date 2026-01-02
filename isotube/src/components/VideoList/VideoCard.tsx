import { useState } from 'react';
import type { Video, VideoStatus } from '../../types';

interface VideoCardProps {
  video: Video;
  isPlaying: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<Video>) => void;
  onDelete: () => void;
  onShowDetail: () => void;
}

const statusColors: Record<VideoStatus, string> = {
  unwatched: 'bg-gray-500',
  in_progress: 'bg-yellow-500',
  completed: 'bg-green-500',
};

const statusLabels: Record<VideoStatus, string> = {
  unwatched: 'Unwatched',
  in_progress: 'In Progress',
  completed: 'Completed',
};

export function VideoCard({
  video,
  isPlaying,
  onSelect,
  onUpdate,
  onDelete,
  onShowDetail,
}: VideoCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(video.title);

  const handleSaveTitle = () => {
    if (editTitle.trim() && editTitle !== video.title) {
      onUpdate({ title: editTitle.trim() });
    }
    setIsEditing(false);
  };

  const handleStatusChange = (status: VideoStatus) => {
    onUpdate({ status });
    setShowMenu(false);
  };

  return (
    <div
      className={`flex gap-3 p-3 rounded-lg cursor-pointer transition-all ${
        isPlaying
          ? 'bg-blue-600/20 ring-2 ring-blue-500'
          : 'bg-gray-800 hover:bg-gray-750'
      }`}
      onClick={onSelect}
    >
      {/* Thumbnail */}
      <div className="relative flex-shrink-0 w-32 aspect-video rounded overflow-hidden bg-gray-700">
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
              <path d="M8 5v14l11-7z" />
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

        {/* Status badge */}
        <div className="mt-auto pt-2 flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${
              video.status === 'completed'
                ? 'bg-green-500/20 text-green-400'
                : video.status === 'in_progress'
                ? 'bg-yellow-500/20 text-yellow-400'
                : 'bg-gray-500/20 text-gray-400'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${statusColors[video.status]}`} />
            {statusLabels[video.status]}
          </span>

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
      <div className="relative flex-shrink-0">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          className="p-1 rounded hover:bg-gray-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </button>

        {showMenu && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(false);
              }}
            />
            <div className="absolute right-0 top-full mt-1 z-20 bg-gray-700 rounded shadow-lg py-1 min-w-[140px]">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                  onShowDetail();
                }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-600"
              >
                Details & Notes
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                  setIsEditing(true);
                }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-600"
              >
                Edit title
              </button>

              <div className="border-t border-gray-600 my-1" />
              <div className="px-3 py-1 text-xs text-gray-400">Mark as</div>

              {(['unwatched', 'in_progress', 'completed'] as VideoStatus[]).map((status) => (
                <button
                  key={status}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStatusChange(status);
                  }}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-600 flex items-center gap-2 ${
                    video.status === status ? 'text-blue-400' : ''
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${statusColors[status]}`} />
                  {statusLabels[status]}
                </button>
              ))}

              <div className="border-t border-gray-600 my-1" />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                  onDelete();
                }}
                className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-gray-600"
              >
                Delete
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
