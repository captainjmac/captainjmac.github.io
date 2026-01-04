import type {Video} from "@/types";
import {VideoDetail} from "@/components/VideoDetail/VideoDetail.tsx";

interface VideoDetailModalProps {
  video: Video | null;
  onUpdate: (updates: Partial<Video>) => void;
  onClose: () => void;
}

export function VideoDetailModal(
  { video, onUpdate, onClose }: VideoDetailModalProps
) {
  if (!video) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative bg-gray-800 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">

        {/* Header */}
        <div className="flex items-start gap-4 p-4 border-b border-gray-700">
          <img
            src={video.thumbnail}
            alt={video.title}
            className="w-32 aspect-video rounded object-cover flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-lg line-clamp-2">{video.title}</h2>
            <a
              href={video.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-400 hover:text-blue-300 mt-1 inline-block"
            >
              Open on YouTube
            </a>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-700 transition-colors flex-shrink-0"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <VideoDetail
          video={video}
          onUpdate={onUpdate}
        />

      </div>
    </div>
  );
}