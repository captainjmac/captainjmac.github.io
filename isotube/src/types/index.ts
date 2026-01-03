export type VideoStatus = 'unwatched' | 'in_progress' | 'completed';

export interface Video {
  id: string;           // YouTube video ID
  url: string;          // Full YouTube URL
  title: string;
  thumbnail: string;
  notes: string;
  rating: number;       // 0-5 stars
  status: VideoStatus;
  progress: number;     // Seconds watched
  addedAt: number;      // Timestamp
  uploadDate?: string;  // YouTube upload date (ISO string)
  description?: string; // YouTube video description
}

export interface Playlist {
  id: string;
  name: string;
  videos: Video[];
  createdAt: number;
}

export interface AppState {
  playlists: Playlist[];
  activePlaylistId: string | null;
  currentVideoId: string | null;
}
