import type {Video} from '@/types';

/**
 * Extract YouTube video ID from various URL formats:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://www.youtube.com/v/VIDEO_ID
 * - https://youtube.com/shorts/VIDEO_ID
 */
export function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/, // Just the ID itself
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}

/**
 * Validate if a string is a valid YouTube video ID
 */
export function isValidVideoId(id: string): boolean {
  return /^[a-zA-Z0-9_-]{11}$/.test(id);
}

/**
 * Build a standard YouTube URL from a video ID
 */
export function buildYouTubeUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

/**
 * Get thumbnail URL for a video
 */
export function getThumbnailUrl(videoId: string, quality: 'default' | 'medium' | 'high' | 'maxres' = 'medium'): string {
  const qualityMap = {
    default: 'default',
    medium: 'mqdefault',
    high: 'hqdefault',
    maxres: 'maxresdefault',
  };
  return `https://img.youtube.com/vi/${videoId}/${qualityMap[quality]}.jpg`;
}

// YouTube Data API v3 key
const YOUTUBE_API_KEY = 'AIzaSyDskb920QxjGsJRJUhZ5z3g5o3Z0j3T_M0';

interface OEmbedResponse {
  title: string;
  author_name: string;
  author_url: string;
  thumbnail_url: string;
  thumbnail_width: number;
  thumbnail_height: number;
}

interface YouTubeAPIResponse {
  items?: Array<{
    snippet: {
      title: string;
      description: string;
      publishedAt: string;
      thumbnails: {
        medium?: { url: string };
        high?: { url: string };
      };
    };
  }>;
}

/**
 * Fetch video metadata using YouTube Data API v3 (requires API key)
 * Returns title, thumbnail, upload date, and description
 */
export async function fetchVideoMetadataFromAPI(videoId: string): Promise<{
  title: string;
  thumbnail: string;
  uploadDate: string;
  description: string;
} | null> {
  const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${YOUTUBE_API_KEY}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error('Failed to fetch video metadata from YouTube API:', response.status);
      return null;
    }

    const data: YouTubeAPIResponse = await response.json();
    const item = data.items?.[0];
    if (!item) {
      return null;
    }

    return {
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails.medium?.url ?? getThumbnailUrl(videoId, 'medium'),
      uploadDate: item.snippet.publishedAt,
      description: item.snippet.description,
    };
  } catch (error) {
    console.error('Error fetching video metadata from YouTube API:', error);
    return null;
  }
}

/**
 * Fetch video metadata using YouTube's oEmbed API (no API key required)
 * Fallback when YouTube Data API is not available
 */
export async function fetchVideoMetadata(videoId: string): Promise<{ title: string; thumbnail: string } | null> {
  const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error('Failed to fetch video metadata:', response.status);
      return null;
    }

    const data: OEmbedResponse = await response.json();
    return {
      title: data.title,
      thumbnail: getThumbnailUrl(videoId, 'medium'),
    };
  } catch (error) {
    console.error('Error fetching video metadata:', error);
    return null;
  }
}

/**
 * Create a new Video object from a URL
 * Tries YouTube Data API v3 first for upload date, falls back to oEmbed
 */
export async function createVideoFromUrl(url: string): Promise<Video | null> {
  const videoId = extractVideoId(url);
  if (!videoId) {
    return null;
  }

  // Try YouTube Data API first (includes upload date)
  const apiMetadata = await fetchVideoMetadataFromAPI(videoId);

  if (apiMetadata) {
    console.log(apiMetadata);
    return {
      id: videoId,
      url: buildYouTubeUrl(videoId),
      title: apiMetadata.title,
      thumbnail: apiMetadata.thumbnail,
      notes: '',
      rating: 0,
      status: 'unwatched',
      progress: 0,
      addedAt: Date.now(),
      uploadDate: apiMetadata.uploadDate,
      description: apiMetadata.description,
    };
  } else {
    console.log('No meta data')
  }

  // Fallback to oEmbed (no upload date)
  const metadata = await fetchVideoMetadata(videoId);

  return {
    id: videoId,
    url: buildYouTubeUrl(videoId),
    title: metadata?.title ?? 'Untitled Video',
    thumbnail: metadata?.thumbnail ?? getThumbnailUrl(videoId),
    notes: '',
    rating: 0,
    status: 'unwatched',
    progress: 0,
    addedAt: Date.now(),
  };
}

// ============================================
// YouTube Playlist Functions
// ============================================

/**
 * Extract YouTube playlist ID from various URL formats:
 * - https://www.youtube.com/playlist?list=PLAYLIST_ID
 * - https://youtube.com/watch?v=VIDEO_ID&list=PLAYLIST_ID
 */
export function extractPlaylistId(url: string): string | null {
    const match = url.match(/[?&]list=([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
}

/**
 * Check if a URL contains a playlist reference
 */
export function isPlaylistUrl(url: string): boolean {
    return extractPlaylistId(url) !== null;
}

export interface PlaylistMetadata {
    id: string;
    title: string;
    description: string;
    thumbnailUrl: string;
    itemCount: number;
}

interface PlaylistItem {
    videoId: string;
    title: string;
    thumbnail: string;
    description: string;
    publishedAt: string;
    position: number;
}

export interface PlaylistImportResult {
    metadata: PlaylistMetadata;
    videos: Omit<Video, 'addedAt'>[];
}

/**
 * Fetch playlist metadata (title, description) from YouTube Data API v3
 */
export async function fetchPlaylistMetadata(playlistId: string): Promise<PlaylistMetadata | null> {
    const url = `https://www.googleapis.com/youtube/v3/playlists?part=snippet,contentDetails&id=${playlistId}&key=${YOUTUBE_API_KEY}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.error('Failed to fetch playlist metadata:', response.status);
            return null;
        }

        const data = await response.json();
        const item = data.items?.[0];
        if (!item) {
            return null;
        }

        return {
            id: playlistId,
            title: item.snippet.title,
            description: item.snippet.description,
            thumbnailUrl: item.snippet.thumbnails?.medium?.url ?? '',
            itemCount: item.contentDetails.itemCount,
        };
    } catch (error) {
        console.error('Error fetching playlist metadata:', error);
        return null;
    }
}

/**
 * Fetch all videos in a playlist, handling pagination
 * Returns videos in playlist order
 */
export async function fetchPlaylistVideos(playlistId: string): Promise<PlaylistItem[]> {
    const allItems: PlaylistItem[] = [];
    let pageToken: string | undefined = undefined;

    do {
        const url = new URL('https://www.googleapis.com/youtube/v3/playlistItems');
        url.searchParams.set('part', 'snippet');
        url.searchParams.set('playlistId', playlistId);
        url.searchParams.set('maxResults', '50');
        url.searchParams.set('key', YOUTUBE_API_KEY);
        if (pageToken) {
            url.searchParams.set('pageToken', pageToken);
        }

        const response = await fetch(url.toString());
        if (!response.ok) {
            throw new Error(`Failed to fetch playlist items: ${response.status}`);
        }

        const data = await response.json();

        for (const item of data.items ?? []) {
            // Skip deleted/private videos (they have no videoId)
            const videoId = item.snippet?.resourceId?.videoId;
            if (!videoId) continue;

            allItems.push({
                videoId,
                title: item.snippet.title,
                thumbnail: item.snippet.thumbnails?.medium?.url ?? getThumbnailUrl(videoId, 'medium'),
                description: item.snippet.description,
                publishedAt: item.snippet.publishedAt,
                position: item.snippet.position,
            });
        }

        pageToken = data.nextPageToken;
    } while (pageToken);

    // Sort by position to maintain playlist order
    return allItems.sort((a, b) => a.position - b.position);
}

/**
 * Convert playlist items to Video objects for import
 */
function playlistItemsToVideos(items: PlaylistItem[]): Omit<Video, 'addedAt'>[] {
    return items.map(item => ({
        id: item.videoId,
        url: buildYouTubeUrl(item.videoId),
        title: item.title,
        thumbnail: item.thumbnail,
        notes: '',
        rating: 0,
        status: 'unwatched' as const,
        progress: 0,
        uploadDate: item.publishedAt,
        description: item.description,
    }));
}

/**
 * Fetch complete playlist data for import
 * Returns playlist metadata and all videos ready for import
 */
export async function fetchPlaylistForImport(url: string): Promise<PlaylistImportResult | null> {
    const playlistId = extractPlaylistId(url);
    if (!playlistId) {
        return null;
    }

    const [metadata, items] = await Promise.all([
        fetchPlaylistMetadata(playlistId),
        fetchPlaylistVideos(playlistId),
    ]);

    if (!metadata) {
        return null;
    }

    return {
        metadata,
        videos: playlistItemsToVideos(items),
    };
}

// ============================================
// YouTube Channel Functions
// ============================================

export interface ChannelIdentifier {
    type: 'id' | 'handle' | 'user' | 'custom';
    value: string;
}

/**
 * Extract channel identifier from various YouTube channel URL formats:
 * - youtube.com/channel/UCxxxxxxx (channel ID)
 * - youtube.com/@handle
 * - youtube.com/user/username
 * - youtube.com/c/customname
 */
export function extractChannelIdentifier(url: string): ChannelIdentifier | null {
    const patterns: Array<{ regex: RegExp; type: ChannelIdentifier['type'] }> = [
        { regex: /youtube\.com\/channel\/([a-zA-Z0-9_-]+)/, type: 'id' },
        { regex: /youtube\.com\/@([a-zA-Z0-9_.-]+)/, type: 'handle' },
        { regex: /youtube\.com\/user\/([a-zA-Z0-9_-]+)/, type: 'user' },
        { regex: /youtube\.com\/c\/([a-zA-Z0-9_-]+)/, type: 'custom' },
    ];

    for (const { regex, type } of patterns) {
        const match = url.match(regex);
        if (match) {
            return { type, value: match[1] };
        }
    }
    return null;
}

/**
 * Check if a URL is a YouTube channel URL
 */
export function isChannelUrl(url: string): boolean {
    return extractChannelIdentifier(url) !== null;
}

export interface ChannelMetadata {
    id: string;              // YouTube channel ID (UC...)
    title: string;           // Channel name
    description: string;
    thumbnail: string;       // Avatar URL
    uploadsPlaylistId: string;  // Uploads playlist (UU...)
}

interface YouTubeChannelAPIResponse {
    items?: Array<{
        id: string;
        snippet: {
            title: string;
            description: string;
            thumbnails: {
                default?: { url: string };
                medium?: { url: string };
                high?: { url: string };
            };
        };
        contentDetails: {
            relatedPlaylists: {
                uploads: string;
            };
        };
    }>;
}

interface YouTubeSearchAPIResponse {
    items?: Array<{
        id: {
            kind: string;
            channelId: string;
        };
        snippet: {
            channelId: string;
            title: string;
            description: string;
            thumbnails: {
                default?: { url: string };
                medium?: { url: string };
            };
        };
    }>;
}

/**
 * Fetch channel metadata by channel ID
 */
async function fetchChannelById(channelId: string): Promise<ChannelMetadata | null> {
    const url = `https://www.googleapis.com/youtube/v3/channels?part=snippet,contentDetails&id=${channelId}&key=${YOUTUBE_API_KEY}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.error('Failed to fetch channel by ID:', response.status);
            return null;
        }

        const data: YouTubeChannelAPIResponse = await response.json();
        const item = data.items?.[0];
        if (!item) {
            return null;
        }

        return {
            id: item.id,
            title: item.snippet.title,
            description: item.snippet.description,
            thumbnail: item.snippet.thumbnails.medium?.url ?? item.snippet.thumbnails.default?.url ?? '',
            uploadsPlaylistId: item.contentDetails.relatedPlaylists.uploads,
        };
    } catch (error) {
        console.error('Error fetching channel by ID:', error);
        return null;
    }
}

/**
 * Fetch channel metadata by username (legacy /user/ URLs)
 */
async function fetchChannelByUsername(username: string): Promise<ChannelMetadata | null> {
    const url = `https://www.googleapis.com/youtube/v3/channels?part=snippet,contentDetails&forUsername=${username}&key=${YOUTUBE_API_KEY}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.error('Failed to fetch channel by username:', response.status);
            return null;
        }

        const data: YouTubeChannelAPIResponse = await response.json();
        const item = data.items?.[0];
        if (!item) {
            return null;
        }

        return {
            id: item.id,
            title: item.snippet.title,
            description: item.snippet.description,
            thumbnail: item.snippet.thumbnails.medium?.url ?? item.snippet.thumbnails.default?.url ?? '',
            uploadsPlaylistId: item.contentDetails.relatedPlaylists.uploads,
        };
    } catch (error) {
        console.error('Error fetching channel by username:', error);
        return null;
    }
}

/**
 * Search for a channel by handle or custom name
 * Uses search API (higher quota cost) then fetches full channel details
 */
async function fetchChannelBySearch(query: string): Promise<ChannelMetadata | null> {
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=channel&maxResults=1&key=${YOUTUBE_API_KEY}`;

    try {
        const response = await fetch(searchUrl);
        if (!response.ok) {
            console.error('Failed to search for channel:', response.status);
            return null;
        }

        const data: YouTubeSearchAPIResponse = await response.json();
        const item = data.items?.[0];
        if (!item || item.id.kind !== 'youtube#channel') {
            return null;
        }

        // Get full channel details including uploads playlist ID
        return fetchChannelById(item.id.channelId);
    } catch (error) {
        console.error('Error searching for channel:', error);
        return null;
    }
}

/**
 * Resolve channel identifier to channel metadata
 */
export async function fetchChannelMetadata(identifier: ChannelIdentifier): Promise<ChannelMetadata | null> {
    switch (identifier.type) {
        case 'id':
            return fetchChannelById(identifier.value);
        case 'user':
            return fetchChannelByUsername(identifier.value);
        case 'handle':
        case 'custom':
            // For @handle and /c/ URLs, we need to search
            return fetchChannelBySearch(identifier.value);
    }
}

/**
 * Fetch latest videos from a channel's uploads playlist
 * Limited to maxResults (default 10)
 */
export async function fetchChannelVideos(
    uploadsPlaylistId: string,
    maxResults: number = 10
): Promise<Omit<Video, 'addedAt'>[]> {
    const url = new URL('https://www.googleapis.com/youtube/v3/playlistItems');
    url.searchParams.set('part', 'snippet');
    url.searchParams.set('playlistId', uploadsPlaylistId);
    url.searchParams.set('maxResults', String(maxResults));
    url.searchParams.set('key', YOUTUBE_API_KEY);

    try {
        const response = await fetch(url.toString());
        if (!response.ok) {
            console.error('Failed to fetch channel videos:', response.status);
            return [];
        }

        const data = await response.json();
        const items: Omit<Video, 'addedAt'>[] = [];

        for (const item of data.items ?? []) {
            const videoId = item.snippet?.resourceId?.videoId;
            if (!videoId) continue;

            items.push({
                id: videoId,
                url: buildYouTubeUrl(videoId),
                title: item.snippet.title,
                thumbnail: item.snippet.thumbnails?.medium?.url ?? getThumbnailUrl(videoId, 'medium'),
                notes: '',
                rating: 0,
                status: 'unwatched',
                progress: 0,
                uploadDate: item.snippet.publishedAt,
                description: item.snippet.description,
            });
        }

        return items;
    } catch (error) {
        console.error('Error fetching channel videos:', error);
        return [];
    }
}

export interface ChannelImportResult {
    metadata: ChannelMetadata;
    videos: Omit<Video, 'addedAt'>[];
}

/**
 * Fetch complete channel data for subscription creation
 * Returns channel metadata and latest 10 videos
 */
export async function fetchChannelForSubscription(url: string): Promise<ChannelImportResult | null> {
    const identifier = extractChannelIdentifier(url);
    if (!identifier) {
        return null;
    }

    const metadata = await fetchChannelMetadata(identifier);
    if (!metadata) {
        return null;
    }

    const videos = await fetchChannelVideos(metadata.uploadsPlaylistId, 10);

    return { metadata, videos };
}
