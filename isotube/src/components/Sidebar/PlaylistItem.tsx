import {useState} from 'react';
import type {Playlist} from '@/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface PlaylistItemProps {
  playlist: Playlist;
  isActive: boolean;
  onSelect: () => void;
  onRename: (name: string) => void;
  onDelete: () => void;
}

export function PlaylistItem({
  playlist,
  isActive,
  onSelect,
  onRename,
  onDelete,
}: PlaylistItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(playlist.name);

  const handleRename = () => {
    if (editName.trim() && editName !== playlist.name) {
      onRename(editName.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRename();
    } else if (e.key === 'Escape') {
      setEditName(playlist.name);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <div className="px-2">
        <input
          type="text"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleRename}
          className="w-full px-3 py-2 bg-gray-700 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          autoFocus
        />
      </div>
    );
  }

  return (
    <div
      className={`group flex items-center gap-2 px-3 py-2 rounded cursor-pointer transition-colors ${
        isActive
          ? 'bg-blue-600 text-white'
          : 'hover:bg-gray-700 text-gray-300'
      }`}
      onClick={onSelect}
    >
      {/* Playlist icon */}
      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h7"/>
      </svg>

      {/* Name and count */}
      <div className="flex-1 min-w-0">
        <span className="block truncate text-sm">{playlist.name}</span>
      </div>
      <span className="text-xs text-gray-400">{playlist.videos.length}</span>

      {/* Menu button */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            onClick={(e) => e.stopPropagation()}
            className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-gray-600 transition-opacity"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"/>
            </svg>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
          >
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
