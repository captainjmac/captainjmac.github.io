import {useMemo} from "react";
import type {Video} from "@/types";

interface VideoFilterSelectorProps {
  value: "all" | "unwatched" | "in_progress" | "completed";
  onChange: (e: any) => void;
  videos: Video[]
}

export function VideoFilterSelector({value, onChange, videos}: VideoFilterSelectorProps) {

  const counts = useMemo(() => ({
    all: videos.length,
    unwatched: videos.filter(v => v.status === 'unwatched').length,
    in_progress: videos.filter(v => v.status === 'in_progress').length,
    completed: videos.filter(v => v.status === 'completed').length,
  }), [videos]);

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-400 shrink-0">Filter:</span>
      <div className="relative flex-1">
        <select
          value={value}
          onChange={onChange}
          className="appearance-none w-full bg-gray-700 text-sm rounded pl-2 pr-7 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
        >
          <option value="all">All ({counts.all})</option>
          <option value="unwatched">Unwatched ({counts.unwatched})</option>
          <option value="in_progress">In Progress ({counts.in_progress})</option>
          <option value="completed">Completed ({counts.completed})</option>
        </select>
        <svg
          className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
}