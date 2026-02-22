import {cn} from '@/lib/utils';
import type {SidebarView} from '@/types';

interface SidebarTabsProps {
  activeTab: SidebarView;
  onTabChange: (tab: SidebarView) => void;
  watchLaterCount: number;
  playlistCount: number;
  subscriptionCount: number;
}

export function SidebarTabs({
  activeTab,
  onTabChange,
  watchLaterCount,
  playlistCount,
  subscriptionCount,
}: SidebarTabsProps) {
  return (
    <div className="flex border-b border-gray-700">
      <button
        onClick={() => onTabChange('watch-later')}
        className={cn(
          'flex-1 px-2 py-2 text-sm font-medium transition-colors',
          activeTab === 'watch-later'
            ? 'border-b-2 border-blue-500 text-blue-400'
            : 'text-gray-400 hover:text-white'
        )}
      >
        Watch Later ({watchLaterCount})
      </button>
      <button
        onClick={() => onTabChange('playlists')}
        className={cn(
          'flex-1 px-2 py-2 text-sm font-medium transition-colors',
          activeTab === 'playlists'
            ? 'border-b-2 border-blue-500 text-blue-400'
            : 'text-gray-400 hover:text-white'
        )}
      >
        Playlists
      </button>
      <button
        onClick={() => onTabChange('subscriptions')}
        className={cn(
          'flex-1 px-2 py-2 text-sm font-medium transition-colors',
          activeTab === 'subscriptions'
            ? 'border-b-2 border-blue-500 text-blue-400'
            : 'text-gray-400 hover:text-white'
        )}
      >
        Channels
      </button>
    </div>
  );
}
