import {useCallback, useRef, useState} from 'react';
import type {Video} from '@/types';
import {usePlaylistsContext} from './hooks/PlaylistsContext';
import {useKeyboardShortcuts} from './hooks/useKeyboardShortcuts';
import {Sidebar} from './components/Sidebar/Sidebar';
import {VideoList} from './components/VideoList/VideoList';
import {AddVideoForm} from './components/VideoList/AddVideoForm';
import {Player, type PlayerHandle} from './components/Player/Player';
import {PlaylistList} from "./components/Sidebar/PlaylistList.tsx";
import {SubscriptionList} from "./components/Sidebar/SubscriptionList.tsx";
import {SidebarTabs} from "./components/Sidebar/SidebarTabs.tsx";
import {Logo} from "./components/common/icons/Logo.tsx";
import {HeaderMenu} from "@/components/Header/HeaderMenu.tsx";
import {VideoDetailSummary} from "@/components/VideoDetail/VideoDetailSummary.tsx";
import {HelpDialog} from "@/components/Header/HelpDialog.tsx";

function App() {
  const {
    playlists,
    activePlaylist,
    playingPlaylist,
    currentVideo,
    currentVideoId,
    currentVideoPlaylistId,
    setVideoProgress,
    setVideoStatus,
    playNext,
    playPrevious,
    sidebarView,
    setSidebarView,
    userPlaylists,
    subscriptions,
    addVideo,
    addVideos,
    createPlaylistWithVideos,
    createSubscription,
    watchLaterPlaylist,
    updateVideo,
    deleteVideo,
  } = usePlaylistsContext();

  const [autoAdvance, setAutoAdvance] = useState(true);

  const playerRef = useRef<PlayerHandle>(null);

  // Find current video index for prev/next (in the playlist it was started from)
  const currentIndex = playingPlaylist?.videos.findIndex(v => v.id === currentVideoId) ?? -1;
  const hasNext = currentIndex >= 0 && currentIndex < (playingPlaylist?.videos.length ?? 0) - 1;
  const hasPrevious = currentIndex > 0;

  // Handle progress updates (track on the playlist the video was started from)
  const handleProgress = useCallback((seconds: number) => {
    if (currentVideoPlaylistId && currentVideoId) {
      setVideoProgress(currentVideoPlaylistId, currentVideoId, seconds);
    }
  }, [currentVideoPlaylistId, currentVideoId, setVideoProgress]);

  // Handle video ended
  const handleEnded = useCallback(() => {
    if (currentVideoPlaylistId && currentVideoId) {
      setVideoStatus(currentVideoPlaylistId, currentVideoId, 'completed');
      setVideoProgress(currentVideoPlaylistId, currentVideoId, 0);
    }
  }, [currentVideoPlaylistId, currentVideoId, setVideoStatus, setVideoProgress]);

  // Callbacks for video detail actions
  const handleDetailUpdate = useCallback((updates: Partial<Video>) => {
    if (currentVideoPlaylistId && currentVideoId) {
      updateVideo(currentVideoPlaylistId, currentVideoId, updates);
    }
  }, [currentVideoPlaylistId, currentVideoId, updateVideo]);

  const handleDetailDelete = useCallback(() => {
    if (currentVideoPlaylistId && currentVideoId) {
      deleteVideo(currentVideoPlaylistId, currentVideoId);
    }
  }, [currentVideoPlaylistId, currentVideoId, deleteVideo]);

  useKeyboardShortcuts({
    onPlayPause: () => playerRef.current?.togglePlay(),
    onNext: hasNext ? playNext : undefined,
    onPrevious: hasPrevious ? playPrevious : undefined,
  });

  return (
    <div
      className="h-screen bg-gray-900 text-white grid grid-cols-1 grid-rows-[auto_1fr_auto] lg:grid-cols-[24rem_1fr] lg:grid-rows-[auto_1fr]">
      {/* Header - spans full width */}
      <header className="col-span-full flex items-center gap-3 px-4 py-3 bg-gray-800 border-b border-gray-700">
        <Logo/>
        <h1 className="text-xl font-bold tracking-tight text-white">
          Iso-Tube
          <small className="hidden sm:inline text-xs font-normal text-purple-400 px-4">
            Watch YouTube videos without the distraction
          </small>
        </h1>
        {activePlaylist && (
          <div className="hidden lg:block flex-1 max-w-xl mx-4">
            <AddVideoForm
              onAddVideo={(video) => addVideo(activePlaylist.id, video)}
              onAddVideos={addVideos}
              onCreatePlaylistWithVideos={createPlaylistWithVideos}
              onCreateSubscription={(channelData) => createSubscription(channelData.metadata, channelData.videos)}
              existingPlaylists={playlists}
              currentPlaylistId={activePlaylist.id}
            />
          </div>
        )}
        <div className="ml-auto flex items-center gap-1">
          <HelpDialog/>
          <HeaderMenu/>
        </div>
      </header>

      {/* Left column: Playlists + Videos stacked (desktop only) */}
      <Sidebar className="hidden lg:flex">
        <SidebarTabs
          activeTab={sidebarView}
          onTabChange={setSidebarView}
          watchLaterCount={watchLaterPlaylist?.videos.length ?? 0}
          playlistCount={userPlaylists.length}
          subscriptionCount={subscriptions.length}
        />
        {sidebarView === 'playlists' && <PlaylistList/>}
        {sidebarView === 'subscriptions' && <SubscriptionList/>}
        <VideoList/>
      </Sidebar>

      {/* Video list - below player on mobile only */}
      <section className="lg:hidden row-start-3 bg-gray-800 overflow-y-auto">
        {activePlaylist && (
          <div className="p-4 border-b border-gray-700">
            <AddVideoForm
              onAddVideo={(video) => addVideo(activePlaylist.id, video)}
              onAddVideos={addVideos}
              onCreatePlaylistWithVideos={createPlaylistWithVideos}
              onCreateSubscription={(channelData) => createSubscription(channelData.metadata, channelData.videos)}
              existingPlaylists={playlists}
              currentPlaylistId={activePlaylist.id}
            />
          </div>
        )}
        <SidebarTabs
          activeTab={sidebarView}
          onTabChange={setSidebarView}
          watchLaterCount={watchLaterPlaylist?.videos.length ?? 0}
          playlistCount={userPlaylists.length}
          subscriptionCount={subscriptions.length}
        />
        {sidebarView === 'playlists' && <PlaylistList/>}
        {sidebarView === 'subscriptions' && <SubscriptionList/>}
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
          onUpdate={handleDetailUpdate}
          onDelete={handleDetailDelete}
        />
      </main>
    </div>
  );
}

export default App;
