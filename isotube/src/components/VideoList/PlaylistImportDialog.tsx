import {useState} from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type {Playlist, Video} from '@/types';
import type {PlaylistImportResult} from '@/utils/youtube';

interface PlaylistImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  importData: PlaylistImportResult;
  existingPlaylists: Playlist[];
  currentPlaylistId: string | null;
  onImportToNew: (playlistName: string, videos: Omit<Video, 'addedAt'>[]) => void;
  onImportToExisting: (playlistId: string, videos: Omit<Video, 'addedAt'>[]) => void;
}

type ImportMode = 'new' | 'existing';

export function PlaylistImportDialog({
  open,
  onOpenChange,
  importData,
  existingPlaylists,
  currentPlaylistId,
  onImportToNew,
  onImportToExisting,
}: PlaylistImportDialogProps) {
  const [mode, setMode] = useState<ImportMode>('new');
  const [newPlaylistName, setNewPlaylistName] = useState(importData.metadata.title);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string>(
    currentPlaylistId ?? existingPlaylists[0]?.id ?? ''
  );
  const [isImporting, setIsImporting] = useState(false);

  const handleImport = () => {
    setIsImporting(true);

    // Use setTimeout to allow the UI to update before the potentially heavy operation
    setTimeout(() => {
      if (mode === 'new') {
        onImportToNew(newPlaylistName.trim() || importData.metadata.title, importData.videos);
      } else {
        onImportToExisting(selectedPlaylistId, importData.videos);
      }
      onOpenChange(false);
      setIsImporting(false);
    }, 50);
  };

  const videoCount = importData.videos.length;
  const playlistTitle = importData.metadata.title;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Import YouTube Playlist</DialogTitle>
          <DialogDescription>
            Found "{playlistTitle}" with {videoCount} video{videoCount !== 1 ? 's' : ''}
          </DialogDescription>
        </DialogHeader>

        {isImporting ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <svg className="w-8 h-8 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
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
            <p className="text-sm text-gray-400">
              Importing {videoCount} videos...
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {/* Option: Create new playlist */}
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="importMode"
                  checked={mode === 'new'}
                  onChange={() => setMode('new')}
                  className="mt-1"
                />
                <div className="flex-1">
                  <span className="font-medium">Create new playlist</span>
                  {mode === 'new' && (
                    <input
                      type="text"
                      value={newPlaylistName}
                      onChange={(e) => setNewPlaylistName(e.target.value)}
                      placeholder="Playlist name"
                      className="mt-2 w-full px-3 py-2 bg-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                </div>
              </label>

              {/* Option: Add to existing playlist */}
              {existingPlaylists.length > 0 && (
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="importMode"
                    checked={mode === 'existing'}
                    onChange={() => setMode('existing')}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <span className="font-medium">Add to existing playlist</span>
                    {mode === 'existing' && (
                      <select
                        value={selectedPlaylistId}
                        onChange={(e) => setSelectedPlaylistId(e.target.value)}
                        className="mt-2 w-full px-3 py-2 bg-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {existingPlaylists.map(playlist => (
                          <option key={playlist.id} value={playlist.id}>
                            {playlist.name} ({playlist.videos.length} videos)
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </label>
              )}
            </div>

            <DialogFooter>
              <button
                onClick={() => onOpenChange(false)}
                className="px-4 py-2 rounded-lg text-sm bg-gray-700 hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={mode === 'new' && !newPlaylistName.trim()}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Import {videoCount} Videos
              </button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
