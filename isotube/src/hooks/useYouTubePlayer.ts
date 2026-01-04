import {useEffect, useRef, useState, useCallback} from 'react';

// YouTube IFrame API types
declare global {
  interface Window {
    YT: typeof YT;
    onYouTubeIframeAPIReady: () => void;
  }
}

declare namespace YT {
  class Player {
    constructor(elementId: string | HTMLElement, options: PlayerOptions);

    playVideo(): void;

    pauseVideo(): void;

    seekTo(seconds: number, allowSeekAhead?: boolean): void;

    getCurrentTime(): number;

    getDuration(): number;

    getPlayerState(): number;

    destroy(): void;
  }

  interface PlayerOptions {
    videoId?: string;
    width?: number | string;
    height?: number | string;
    playerVars?: PlayerVars;
    events?: Events;
  }

  interface PlayerVars {
    autoplay?: 0 | 1;
    controls?: 0 | 1;
    rel?: 0 | 1;
    modestbranding?: 0 | 1;
    iv_load_policy?: 1 | 3;
    fs?: 0 | 1;
    playsinline?: 0 | 1;
    start?: number;
  }

  interface Events {
    onReady?: (event: PlayerEvent) => void;
    onStateChange?: (event: OnStateChangeEvent) => void;
    onError?: (event: OnErrorEvent) => void;
  }

  interface PlayerEvent {
    target: Player;
  }

  interface OnStateChangeEvent {
    target: Player;
    data: number;
  }

  interface OnErrorEvent {
    target: Player;
    data: number;
  }

  enum PlayerState {
    UNSTARTED = -1,
    ENDED = 0,
    PLAYING = 1,
    PAUSED = 2,
    BUFFERING = 3,
    CUED = 5,
  }
}

// Load YouTube IFrame API script
let apiLoadPromise: Promise<void> | null = null;

function loadYouTubeAPI(): Promise<void> {
  if (apiLoadPromise) return apiLoadPromise;

  apiLoadPromise = new Promise((resolve) => {
    if (window.YT && window.YT.Player) {
      resolve();
      return;
    }

    window.onYouTubeIframeAPIReady = () => {
      resolve();
    };

    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(script);
  });

  return apiLoadPromise;
}

interface UseYouTubePlayerOptions {
  videoId: string | null;
  startTime?: number;
  autoplay?: boolean;
  onProgress?: (seconds: number) => void;
  onEnded?: () => void;
  onPause?: (seconds: number) => void;
}

export function useYouTubePlayer({
  videoId,
  startTime = 0,
  autoplay = true,
  onProgress,
  onEnded,
  onPause,
}: UseYouTubePlayerOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YT.Player | null>(null);
  const progressIntervalRef = useRef<number | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Store callbacks in refs to avoid recreating player
  const callbacksRef = useRef({onProgress, onEnded, onPause});
  callbacksRef.current = {onProgress, onEnded, onPause};

  // Store startTime in a ref - only capture it when videoId changes
  const startTimeRef = useRef(startTime);
  const lastVideoIdRef = useRef(videoId);
  if (videoId !== lastVideoIdRef.current) {
    startTimeRef.current = startTime;
    lastVideoIdRef.current = videoId;
  }

  // Initialize player
  useEffect(() => {
    if (!videoId || !containerRef.current) return;

    let mounted = true;
    let player: YT.Player | null = null;

    const initPlayer = async () => {
      await loadYouTubeAPI();
      if (!mounted || !containerRef.current) return;

      // Create a div for the player
      const playerDiv = document.createElement('div');
      containerRef.current.innerHTML = '';
      containerRef.current.appendChild(playerDiv);

      player = new window.YT.Player(playerDiv, {
        videoId,
        width: '100%',
        height: '100%',
        playerVars: {
          autoplay: autoplay ? 1 : 0,
          controls: 0,
          rel: 0,
          iv_load_policy: 3, // Hide annotations
          fs: 1,
          playsinline: 1,
          start: Math.floor(startTimeRef.current),
        },
        events: {
          onReady: (event) => {
            if (!mounted) return;
            playerRef.current = event.target;
            setIsReady(true);
            setDuration(event.target.getDuration());
          },
          onStateChange: (event) => {
            if (!mounted) return;
            const state = event.data;

            if (state === 1) {
              // Playing
              setIsPlaying(true);
              setDuration(event.target.getDuration());

              // Start progress tracking
              if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current);
              }
              progressIntervalRef.current = window.setInterval(() => {
                if (playerRef.current) {
                  const time = playerRef.current.getCurrentTime();
                  setCurrentTime(time);
                  callbacksRef.current.onProgress?.(time);
                }
              }, 1000);
            } else if (state === 2) {
              // Paused
              setIsPlaying(false);
              if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current);
                progressIntervalRef.current = null;
              }
              const time = event.target.getCurrentTime();
              setCurrentTime(time);
              callbacksRef.current.onPause?.(time);
            } else if (state === 0) {
              // Ended
              setIsPlaying(false);
              if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current);
                progressIntervalRef.current = null;
              }
              callbacksRef.current.onEnded?.();
            }
          },
          onError: (event) => {
            console.error('YouTube Player Error:', event.data);
          },
        },
      });
    };

    initPlayer();

    return () => {
      mounted = false;
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      if (player) {
        player.destroy();
      }
      playerRef.current = null;
      setIsReady(false);
      setIsPlaying(false);
    };
  }, [videoId, autoplay]);

  // Player controls
  const play = useCallback(() => {
    playerRef.current?.playVideo();
  }, []);

  const pause = useCallback(() => {
    playerRef.current?.pauseVideo();
  }, []);

  const seekTo = useCallback((seconds: number) => {
    playerRef.current?.seekTo(seconds, true);
    setCurrentTime(seconds);
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  return {
    containerRef,
    isReady,
    isPlaying,
    currentTime,
    duration,
    play,
    pause,
    seekTo,
    togglePlay,
  };
}
