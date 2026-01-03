import {useState} from 'react';
import type {Video, VideoStatus} from '@/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {usePlaylistsContext} from "@/hooks/PlaylistsContext.tsx";

interface VideoCardProps {
  video: Video;
  isPlaying: boolean;
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
  onShowDetail,
}: VideoCardProps) {

  const {
    activePlaylist,
    setCurrentVideo,
    updateVideo,
    deleteVideo,
  } = usePlaylistsContext();

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(video.title);

  if (!activePlaylist) {
    return null;
  }

  const handleSaveTitle = () => {
    if (editTitle.trim() && editTitle !== video.title) {
      handleUpdate({title: editTitle.trim()});
    }
    setIsEditing(false);
  };

  const handleStatusChange = (status: VideoStatus) => {
    handleUpdate({status});
  };

  const handleUpdate = (updates: Partial<Video>) => {
    updateVideo(activePlaylist.id, video.id, updates);
  }

  return (
    <div
      className={`flex gap-3 p-2 rounded-lg cursor-pointer transition-all min-w-0 overflow-hidden ${
        isPlaying
          ? 'bg-blue-600/20 ring-2 ring-blue-500'
          : 'bg-gray-800 hover:bg-gray-750'
      }`}
      onClick={() => setCurrentVideo(video.id)}
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
            <span className={`w-1.5 h-1.5 rounded-full ${statusColors[video.status]}`}/>
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
      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
          <button className="p-1 rounded hover:bg-gray-600 transition-colors flex-shrink-0">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"/>
            </svg>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[160px]">
          <DropdownMenuItem onClick={onShowDetail}>
            Details & Notes
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setIsEditing(true)}>
            Edit title
          </DropdownMenuItem>

          <DropdownMenuSeparator/>
          <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
            Mark as
          </DropdownMenuLabel>

          {(['unwatched', 'in_progress', 'completed'] as VideoStatus[]).map((status) => (
            <DropdownMenuItem
              key={status}
              onClick={() => handleStatusChange(status)}
              className={video.status === status ? 'text-blue-400' : ''}
            >
              <span className={`w-2 h-2 rounded-full ${statusColors[status]}`}/>
              {statusLabels[status]}
            </DropdownMenuItem>
          ))}

          <DropdownMenuSeparator/>
          <DropdownMenuItem
            variant="destructive"
            onClick={() => deleteVideo(activePlaylist.id, video.id)}
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
