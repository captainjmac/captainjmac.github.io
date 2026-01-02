import {useCallback, useRef, useState} from 'react';
import {usePlaylistsContext} from './hooks/PlaylistsContext';
import {useKeyboardShortcuts} from './hooks/useKeyboardShortcuts';
import {Sidebar} from './components/Sidebar/Sidebar';
import {VideoList} from './components/VideoList/VideoList';
import {Player, type PlayerHandle} from './components/Player/Player';
import {PlaylistList} from "./components/Sidebar/PlaylistList.tsx";
import {Logo} from "./components/common/icons/Logo.tsx";

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
        <div className="flex flex-col h-screen bg-gray-900 text-white">
            <header className="flex items-center gap-3 px-4 py-3 bg-gray-800 border-b border-gray-700 shrink-0">
                <Logo/>
                <h1 className="text-xl font-bold tracking-tight text-white">
                    Iso-Tube
                </h1>
            </header>


            <div className="flex flex-1 min-h-0">
                <Sidebar>
                    <PlaylistList/>
                    <VideoList/>
                </Sidebar>

                {/* Main Content */}
                <main className="flex-1 flex flex-col min-w-0">
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
                </main>
            </div>
        </div>
    );
}

export default App;
