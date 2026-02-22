import {useState} from 'react';
import {usePlaylistsContext} from '@/hooks/PlaylistsContext';
import {SubscriptionItem, SubscriptionMenuItems} from './SubscriptionItem';
import {fetchChannelVideos, fetchAllChannelVideos} from '@/utils/youtube';
import {ChannelIcon} from '@/components/common/icons/ChannelIcon';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function SubscriptionList() {
  const {
    subscriptions,
    activeSubscriptionId,
    setActiveSubscription,
    deleteSubscription,
    refreshSubscription,
    getSubscriptionPlaylist,
  } = usePlaylistsContext();

  const [isExpanded, setIsExpanded] = useState(false);
  const [refreshingIds, setRefreshingIds] = useState<Set<string>>(new Set());
  const [fetchingAllIds, setFetchingAllIds] = useState<Set<string>>(new Set());

  const activeSubscription = subscriptions.find((s) => s.id === activeSubscriptionId);
  const activePlaylist = activeSubscription ? getSubscriptionPlaylist(activeSubscription.id) : null;

  const handleSelectSubscription = (subscriptionId: string) => {
    setActiveSubscription(subscriptionId);
    setIsExpanded(false);
  };

  const handleRefresh = async (subscription: typeof subscriptions[0]) => {
    if (refreshingIds.has(subscription.id)) return;

    setRefreshingIds((prev) => new Set(prev).add(subscription.id));

    try {
      // The uploads playlist ID is the channel ID with UC replaced by UU
      const uploadsPlaylistId = subscription.channelId.replace(/^UC/, 'UU');
      const videos = await fetchChannelVideos(uploadsPlaylistId, 10);
      refreshSubscription(subscription.id, videos);
    } catch (error) {
      console.error('Failed to refresh subscription:', error);
    } finally {
      setRefreshingIds((prev) => {
        const next = new Set(prev);
        next.delete(subscription.id);
        return next;
      });
    }
  };

  const handleFetchAll = async (subscription: typeof subscriptions[0]) => {
    if (fetchingAllIds.has(subscription.id)) return;

    setFetchingAllIds((prev) => new Set(prev).add(subscription.id));

    try {
      const uploadsPlaylistId = subscription.channelId.replace(/^UC/, 'UU');
      const videos = await fetchAllChannelVideos(uploadsPlaylistId);
      refreshSubscription(subscription.id, videos);
    } catch (error) {
      console.error('Failed to fetch all channel videos:', error);
    } finally {
      setFetchingAllIds((prev) => {
        const next = new Set(prev);
        next.delete(subscription.id);
        return next;
      });
    }
  };

  return (
    <div className="shrink-0 overflow-auto p-2">
      <div className="flex items-center gap-1">
        <div className="flex-1 flex items-center gap-2 min-w-0 px-3 py-2">
          <ChannelIcon className="w-4 h-4 flex-shrink-0 text-gray-400"/>
          <span className="text-sm font-medium truncate">
                        {activeSubscription?.name ?? 'Select Channel'}
                    </span>
          {activePlaylist && (
            <span className="text-xs text-gray-400">({activePlaylist.videos.length})</span>
          )}
        </div>

        {/* Active channel menu */}
        {activeSubscription && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1.5 rounded hover:bg-gray-600 transition-colors">
                <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"/>
                </svg>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <SubscriptionMenuItems
                isRefreshing={refreshingIds.has(activeSubscription.id)}
                isFetchingAll={fetchingAllIds.has(activeSubscription.id)}
                onRefresh={() => handleRefresh(activeSubscription)}
                onFetchAll={() => handleFetchAll(activeSubscription)}
                onDelete={() => deleteSubscription(activeSubscription.id)}
              />
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Expand/collapse button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1.5 rounded hover:bg-gray-600 transition-colors"
        >
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
          </svg>
        </button>
      </div>

      {/* Expandable subscription list */}
      {isExpanded && (
        <div className="mt-2 border-t border-gray-700 pt-2">
          <div className="flex items-center justify-between px-2 py-1 mb-2">
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                            Channels
                        </span>
          </div>

          {/* Subscription list */}
          {subscriptions.length === 0 ? (
            <p className="text-gray-500 text-sm px-2 py-4 text-center">
              No subscriptions yet.
              <br/>
              <span className="text-xs mt-1 block">
                                Paste a channel URL to subscribe
                            </span>
            </p>
          ) : (
            <div className="space-y-1">
              {subscriptions.map((subscription) => {
                const playlist = getSubscriptionPlaylist(subscription.id);
                return (
                  <SubscriptionItem
                    key={subscription.id}
                    subscription={subscription}
                    videoCount={playlist?.videos.length ?? 0}
                    isActive={subscription.id === activeSubscriptionId}
                    isRefreshing={refreshingIds.has(subscription.id)}
                    onSelect={() => handleSelectSubscription(subscription.id)}
                    onRefresh={() => handleRefresh(subscription)}
                    onFetchAll={() => handleFetchAll(subscription)}
                    isFetchingAll={fetchingAllIds.has(subscription.id)}
                    onDelete={() => deleteSubscription(subscription.id)}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
