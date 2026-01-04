import {useState} from 'react';
import {usePlaylistsContext} from '@/hooks/PlaylistsContext';
import {SubscriptionItem} from './SubscriptionItem';
import {fetchChannelVideos} from '@/utils/youtube';
import {ChannelIcon} from '@/components/common/icons/ChannelIcon';

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

  return (
    <div className="shrink-0 overflow-auto p-2">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-3 py-2 rounded hover:bg-gray-700 transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          <ChannelIcon className="w-4 h-4 flex-shrink-0 text-gray-400"/>
          <span className="text-sm font-medium truncate">
                        {activeSubscription?.name ?? 'Select Channel'}
                    </span>
          {activePlaylist && (
            <span className="text-xs text-gray-400">({activePlaylist.videos.length})</span>
          )}
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
        </svg>
      </button>

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
