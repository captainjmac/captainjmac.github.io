import type {Subscription} from '@/types';
import {RefreshIcon} from '@/components/common/icons/RefreshIcon';
import {ChannelIcon} from '@/components/common/icons/ChannelIcon';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {cn} from '@/lib/utils';

interface SubscriptionItemProps {
    subscription: Subscription;
    videoCount: number;
    isActive: boolean;
    isRefreshing: boolean;
    onSelect: () => void;
    onRefresh: () => void;
    onDelete: () => void;
}

export function SubscriptionItem({
    subscription,
    videoCount,
    isActive,
    isRefreshing,
    onSelect,
    onRefresh,
    onDelete,
}: SubscriptionItemProps) {
    const formatLastRefreshed = (timestamp: number | null) => {
        if (!timestamp) return 'Never';
        const diff = Date.now() - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    };

    return (
        <div
            className={cn(
                'group flex items-center gap-2 px-3 py-2 rounded cursor-pointer transition-colors',
                isActive
                    ? 'bg-blue-600 text-white'
                    : 'hover:bg-gray-700 text-gray-300'
            )}
            onClick={onSelect}
        >
            {/* Channel thumbnail or fallback icon */}
            {subscription.thumbnail ? (
                <img
                    src={subscription.thumbnail}
                    alt={subscription.name}
                    className="w-6 h-6 rounded-full flex-shrink-0 object-cover"
                />
            ) : (
                <ChannelIcon className="w-5 h-5 flex-shrink-0" />
            )}

            {/* Name and info */}
            <div className="flex-1 min-w-0">
                <span className="block truncate text-sm">{subscription.name}</span>
                <span className={cn(
                    'text-xs',
                    isActive ? 'text-blue-200' : 'text-gray-500'
                )}>
                    {formatLastRefreshed(subscription.lastRefreshed)}
                </span>
            </div>

            {/* Video count */}
            <span className="text-xs text-gray-400">{videoCount}</span>

            {/* Refresh button */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onRefresh();
                }}
                disabled={isRefreshing}
                className={cn(
                    'p-1 rounded transition-all',
                    isRefreshing
                        ? 'animate-spin text-blue-400'
                        : 'opacity-0 group-hover:opacity-100 hover:bg-gray-600'
                )}
                title="Refresh videos"
            >
                <RefreshIcon className="w-4 h-4" />
            </button>

            {/* Menu button */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button
                        onClick={(e) => e.stopPropagation()}
                        className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-gray-600 transition-opacity"
                    >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                        </svg>
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem
                        variant="destructive"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete();
                        }}
                    >
                        Unsubscribe
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
