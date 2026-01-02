import {forwardRef, useImperativeHandle} from 'react';
import {useYouTubePlayer} from '../../hooks/useYouTubePlayer';
import type {Video} from '../../types';
import {NoVideoIcon} from "../common/icons/NoVideoIcon.tsx";
import {Spinner} from "../common/icons/Spinner.tsx";
import {PreviousIcon} from "../common/icons/PreviousIcon.tsx";
import {PauseIcon} from "../common/icons/PauseIcon.tsx";
import {PlayIcon} from "../common/icons/PlayIcon.tsx";
import {NextIcon} from "../common/icons/NextIcon.tsx";
import {PlayPauseIcon} from "../common/icons/PlayPauseIcon.tsx";

interface PlayerProps {
    video: Video | null;
    autoAdvance: boolean;
    onToggleAutoAdvance: () => void;
    onProgress: (seconds: number) => void;
    onEnded: () => void;
    hasNext: boolean;
    hasPrevious: boolean;
    onNext: () => void;
    onPrevious: () => void;
}

export interface PlayerHandle {
    togglePlay: () => void;
}

function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export const Player = forwardRef<PlayerHandle, PlayerProps>(function Player({
    video,
    autoAdvance,
    onToggleAutoAdvance,
    onProgress,
    onEnded,
    hasNext,
    hasPrevious,
    onNext,
    onPrevious,
}, ref) {
    const {
        containerRef,
        isReady,
        isPlaying,
        currentTime,
        duration,
        togglePlay,
    } = useYouTubePlayer({
        videoId: video?.id ?? null,
        startTime: video?.progress ?? 0,
        autoplay: true,
        onProgress,
        onEnded: () => {
            onEnded();
            if (autoAdvance && hasNext) {
                onNext();
            }
        },
        onPause: onProgress,
    });

    // Expose togglePlay to parent via ref
    useImperativeHandle(ref, () => ({
        togglePlay,
    }), [togglePlay]);

    if (!video) {
        return (
            <div className="bg-black aspect-video max-h-[50vh] flex items-center justify-center">
                <div className="text-center px-4">
                    <NoVideoIcon/>
                    <p className="text-gray-500">Select a video to play</p>
                    <p className="text-gray-600 text-xs mt-2">
                        Keyboard: Space to play/pause, N for next, P for previous
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-black flex flex-col">
            {/* Video container */}
            <div className="aspect-video max-h-[55vh] relative">
                <div ref={containerRef} className="w-full h-full"/>
                {!isReady && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                        <Spinner/>
                    </div>
                )}
            </div>

            {/* Controls bar */}
            <div className="bg-gray-800 px-2 sm:px-4 py-2 flex items-center gap-2 sm:gap-4">
                {/* Play/Pause and navigation */}
                <div className="flex items-center gap-1 sm:gap-2">
                    <button
                        onClick={onPrevious}
                        disabled={!hasPrevious}
                        className="p-1.5 sm:p-2 rounded hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Previous video (P)"
                    >
                        <PreviousIcon/>
                    </button>

                    <button
                        onClick={togglePlay}
                        className="p-1.5 sm:p-2 rounded hover:bg-gray-700 transition-colors"
                        title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
                    >
                        {isPlaying ? (
                            <PauseIcon/>
                        ) : (
                            <PlayIcon/>
                        )}
                    </button>

                    <button
                        onClick={onNext}
                        disabled={!hasNext}
                        className="p-1.5 sm:p-2 rounded hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Next video (N)"
                    >
                        <NextIcon/>
                    </button>
                </div>

                {/* Progress bar */}
                <div className="flex-1 flex items-center gap-2 sm:gap-3">
                    <span className="text-xs text-gray-400 w-8 sm:w-10 text-right hidden sm:block">
                        {formatTime(currentTime)}
                    </span>
                    <div className="flex-1 h-1 bg-gray-600 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-blue-500 transition-all duration-200"
                            style={{width: duration ? `${(currentTime / duration) * 100}%` : '0%'}}
                        />
                    </div>
                    <span className="text-xs text-gray-400 w-8 sm:w-10 hidden sm:block">
                        {formatTime(duration)}
                    </span>
                </div>

                {/* Auto-advance toggle */}
                <button
                    onClick={onToggleAutoAdvance}
                    className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 rounded text-xs sm:text-sm transition-colors ${
                        autoAdvance
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                    title={autoAdvance ? 'Auto-advance is on' : 'Auto-advance is off'}
                >
                    <PlayPauseIcon/>
                    <span className="hidden sm:inline">Auto</span>
                </button>
            </div>

            {/* Video title */}
            <div className="bg-gray-800 border-t border-gray-700 px-3 sm:px-4 py-2">
                <h3 className="font-medium text-sm truncate" title={video.title}>
                    {video.title}
                </h3>
            </div>
        </div>
    );
});
