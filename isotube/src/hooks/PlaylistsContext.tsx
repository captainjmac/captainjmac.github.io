import {createContext, useContext, type ReactNode} from 'react';
import {usePlaylists} from './usePlaylists';

type PlaylistsContextType = ReturnType<typeof usePlaylists>;

const PlaylistsContext = createContext<PlaylistsContextType | null>(null);

export function PlaylistsProvider({children}: { children: ReactNode }) {
    const playlists = usePlaylists();
    return (
        <PlaylistsContext.Provider value={playlists}>
            {children}
        </PlaylistsContext.Provider>
    );
}

export function usePlaylistsContext() {
    const context = useContext(PlaylistsContext);
    if (!context) {
        throw new Error('usePlaylistsContext must be used within a PlaylistsProvider');
    }
    return context;
}
