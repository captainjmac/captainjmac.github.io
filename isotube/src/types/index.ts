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
  linkedSubscriptionId?: string | null;  // null/undefined = user-defined playlist
}

export interface Subscription {
  id: string;
  channelId: string;           // YouTube channel ID (UC...)
  name: string;                // Channel display name
  thumbnail: string;           // Channel avatar URL
  linkedPlaylistId: string;    // ID of auto-managed playlist
  lastRefreshed: number | null;
  createdAt: number;
}

export type SidebarView = 'playlists' | 'subscriptions';

export interface AppState {
  playlists: Playlist[];
  subscriptions: Subscription[];
  activePlaylistId: string | null;
  activeSubscriptionId: string | null;
  currentVideoId: string | null;
  sidebarView: SidebarView;
}
