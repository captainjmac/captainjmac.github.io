import {useState} from 'react';
import type {Video, VideoStatus} from '@/types';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const statusColors: Record<VideoStatus, string> = {
    unwatched: 'bg-gray-500',
    in_progress: 'bg-yellow-500',
    completed: 'bg-green-500',
};

export const statusLabels: Record<VideoStatus, string> = {
    unwatched: 'Unwatched',
    in_progress: 'In Progress',
    completed: 'Completed',
};

interface VideoActionsDropdownProps {
    video: Video;
    onUpdate: (updates: Partial<Video>) => void;
    onDelete: () => void;
    onShowDetail?: () => void;
    onEditTitle?: () => void;
    align?: "start" | "end";
}

export function VideoActionsDropdown({
    video,
    onUpdate,
    onDelete,
    onShowDetail,
    onEditTitle,
    align = "end",
}: VideoActionsDropdownProps) {
    const [copied, setCopied] = useState(false);

    const handleCopyUrl = () => {
        navigator.clipboard.writeText(video.url).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        });
    };

    const handleStatusChange = (status: VideoStatus) => {
        onUpdate({status});
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
                <button className="p-1 rounded hover:bg-gray-600 transition-colors flex-shrink-0">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"/>
                    </svg>
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={align} className="min-w-[160px]">
                <DropdownMenuItem onClick={handleCopyUrl}>
                    {copied ? 'Copied!' : 'Copy URL'}
                </DropdownMenuItem>

                {onShowDetail && (
                    <DropdownMenuItem onClick={onShowDetail}>
                        Details & Notes
                    </DropdownMenuItem>
                )}
                {onEditTitle && (
                    <DropdownMenuItem onClick={onEditTitle}>
                        Edit title
                    </DropdownMenuItem>
                )}

                <DropdownMenuSeparator/>
                <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                    Mark as
                </DropdownMenuLabel>

                {(['unwatched', 'in_progress', 'completed'] as VideoStatus[]).map((status) => (
                    <DropdownMenuItem
                        key={status}
                        onClick={() => handleStatusChange(status)}
                        className={video.status === status ? 'text-blue-400' : ''}
                    >
                        <span className={`w-2 h-2 rounded-full ${statusColors[status]}`}/>
                        {statusLabels[status]}
                    </DropdownMenuItem>
                ))}

                <DropdownMenuSeparator/>
                <DropdownMenuItem
                    variant="destructive"
                    onClick={onDelete}
                >
                    Delete
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
