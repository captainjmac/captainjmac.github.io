import {useState} from 'react';
import {usePlaylistsContext} from '../../hooks/PlaylistsContext';
import {PlaylistItem} from './PlaylistItem';

export function PlaylistList() {
  const {
    playlists,
    activePlaylistId,
    setActivePlaylist,
    createPlaylist,
    renamePlaylist,
    deletePlaylist,
  } = usePlaylistsContext();

  const [isExpanded, setIsExpanded] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');

  const activePlaylist = playlists.find((p) => p.id === activePlaylistId);

  const handleCreate = () => {
    if (newPlaylistName.trim()) {
      createPlaylist(newPlaylistName.trim());
      setNewPlaylistName('');
      setIsCreating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreate();
    } else if (e.key === 'Escape') {
      setIsCreating(false);
      setNewPlaylistName('');
    }
  };

  const handleSelectPlaylist = (playlistId: string) => {
    setActivePlaylist(playlistId);
    setIsExpanded(false);
  };

  return (
    <div className="shrink-0 overflow-auto p-2">

      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-3 py-2 rounded hover:bg-gray-700 transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          <svg className="w-4 h-4 flex-shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h7"/>
          </svg>
          <span className="text-sm font-medium truncate">
            {activePlaylist?.name ?? 'Select Playlist'}
          </span>
          {activePlaylist && (
            <span className="text-xs text-gray-400">({activePlaylist.videos.length})</span>
          )}
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
        </svg>
      </button>

      {/* Expandable playlist list */}
      {isExpanded && (
        <div className="mt-2 border-t border-gray-700 pt-2">
          <div className="flex items-center justify-between px-2 py-1 mb-2">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Playlists
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsCreating(true);
              }}
              className="text-gray-400 hover:text-white transition-colors"
              title="New playlist"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
              </svg>
            </button>
          </div>

          {/* New playlist input */}
          {isCreating && (
            <div className="mb-2 px-2">
              <input
                type="text"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={() => {
                  if (!newPlaylistName.trim()) {
                    setIsCreating(false);
                  }
                }}
                placeholder="Playlist name..."
                className="w-full px-3 py-2 bg-gray-700 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleCreate}
                  disabled={!newPlaylistName.trim()}
                  className="flex-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded text-sm transition-colors"
                >
                  Create
                </button>
                <button
                  onClick={() => {
                    setIsCreating(false);
                    setNewPlaylistName('');
                  }}
                  className="px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded text-sm transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Playlist list */}
          {playlists.length === 0 && !isCreating ? (
            <p className="text-gray-500 text-sm px-2 py-4 text-center">
              No playlists yet.
              <br/>
              <button
                onClick={() => setIsCreating(true)}
                className="text-blue-400 hover:text-blue-300 mt-1"
              >
                Create one
              </button>
            </p>
          ) : (
            <div className="space-y-1">
              {playlists.map((playlist) => (
                <PlaylistItem
                  key={playlist.id}
                  playlist={playlist}
                  isActive={playlist.id === activePlaylistId}
                  onSelect={() => handleSelectPlaylist(playlist.id)}
                  onRename={(name) => renamePlaylist(playlist.id, name)}
                  onDelete={() => deletePlaylist(playlist.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
