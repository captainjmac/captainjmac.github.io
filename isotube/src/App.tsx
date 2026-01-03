import {useCallback, useRef, useState} from 'react';
import {usePlaylistsContext} from './hooks/PlaylistsContext';
import {useKeyboardShortcuts} from './hooks/useKeyboardShortcuts';
import {Sidebar} from './components/Sidebar/Sidebar';
import {VideoList} from './components/VideoList/VideoList';
import {Player, type PlayerHandle} from './components/Player/Player';
import {PlaylistList} from "./components/Sidebar/PlaylistList.tsx";
import {Logo} from "./components/common/icons/Logo.tsx";
import {HeaderMenu} from "@/components/Header/HeaderMenu.tsx";
import {VideoDetailSummary} from "@/components/VideoDetail/VideoDetailSummary.tsx";

function App() {
  const {
    activePlaylist,
    currentVideo,
    currentVideoId,
    setVideoProgress,
    setVideoStatus,
    playNext,
    playPrevious,
  } = usePlaylistsContext();

  const [autoAdvance, setAutoAdvance] = useState(true);

  const playerRef = useRef<PlayerHandle>(null);

  // Find current video index for prev/next
  const currentIndex = activePlaylist?.videos.findIndex(v => v.id === currentVideoId) ?? -1;
  const hasNext = currentIndex >= 0 && currentIndex < (activePlaylist?.videos.length ?? 0) - 1;
  const hasPrevious = currentIndex > 0;

  // Handle progress updates
  const handleProgress = useCallback((seconds: number) => {
    if (activePlaylist && currentVideoId) {
      setVideoProgress(activePlaylist.id, currentVideoId, seconds);
    }
  }, [activePlaylist, currentVideoId, setVideoProgress]);

  // Handle video ended
  const handleEnded = useCallback(() => {
    if (activePlaylist && currentVideoId) {
      setVideoStatus(activePlaylist.id, currentVideoId, 'completed');
      setVideoProgress(activePlaylist.id, currentVideoId, 0);
    }
  }, [activePlaylist, currentVideoId, setVideoStatus, setVideoProgress]);

  useKeyboardShortcuts({
    onPlayPause: () => playerRef.current?.togglePlay(),
    onNext: hasNext ? playNext : undefined,
    onPrevious: hasPrevious ? playPrevious : undefined,
  });

  return (
    <div className="dark h-screen bg-gray-900 text-white grid grid-cols-1 grid-rows-[auto_1fr_auto] lg:grid-cols-[24rem_1fr] lg:grid-rows-[auto_1fr]">
      {/* Header - spans full width */}
      <header className="col-span-full flex items-center gap-3 px-4 py-3 bg-gray-800 border-b border-gray-700">
        <Logo/>
        <h1 className="text-xl font-bold tracking-tight text-white">
          Iso-Tube
          <small className="text-xs font-normal text-purple-400 px-4">
            Watch YouTube videos without the distraction
          </small>
        </h1>
        <HeaderMenu/>
      </header>

      {/* Left column: Playlists + Videos stacked (desktop only) */}
      <Sidebar className="hidden lg:flex">
        <PlaylistList/>
        <VideoList/>
      </Sidebar>

      {/* Video list - below player on mobile only */}
      <section className="lg:hidden row-start-3 bg-gray-800 overflow-y-auto">
        <VideoList/>
      </section>

      {/* Player - main content area */}
      <main className="row-start-2 lg:col-start-2 flex flex-col min-w-0 min-h-0">
        <Player
          ref={playerRef}
          video={currentVideo}
          autoAdvance={autoAdvance}
          onToggleAutoAdvance={() => setAutoAdvance(!autoAdvance)}
          onProgress={handleProgress}
          onEnded={handleEnded}
          hasNext={hasNext}
          hasPrevious={hasPrevious}
          onNext={playNext}
          onPrevious={playPrevious}
        />
        <VideoDetailSummary
          video={currentVideo}
        />
      </main>
    </div>
  );
}

export default App;
