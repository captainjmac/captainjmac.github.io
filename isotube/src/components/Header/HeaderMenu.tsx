import {useRef, useState} from 'react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {usePlaylistsContext} from '@/hooks/PlaylistsContext';
import {useSyncSettings} from '@/hooks/useSyncSettings';
import {useCloudSync} from '@/hooks/useCloudSync';
import {SyncSettingsDialog} from '@/components/Settings/SyncSettingsDialog';
import type {AppState} from '@/types';

export function HeaderMenu() {
    const {exportState, importState} = usePlaylistsContext();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [syncDialogOpen, setSyncDialogOpen] = useState(false);

    const currentState = exportState();
    const {settings, setCredentials, setEnabled, setLastSyncedAt, clearSettings} = useSyncSettings();

    const {
        isConnected,
        isSyncing,
        lastSyncedAt,
        error,
        syncNow,
        testConnection,
        disconnect,
    } = useCloudSync({
        settings,
        currentState,
        onRemoteStateLoaded: importState,
        onSyncComplete: setLastSyncedAt,
    });

    const handleExport = () => {
        const state = exportState();
        const json = JSON.stringify(state, null, 2);
        const blob = new Blob([json], {type: 'application/json'});
        const url = URL.createObjectURL(blob);

        const date = new Date().toISOString().split('T')[0];
        const filename = `isotube-backup-${date}.json`;

        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();

        URL.revokeObjectURL(url);
    };

    const handleImport = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const content = event.target?.result as string;
                const state = JSON.parse(content) as AppState;

                // Basic validation
                if (!Array.isArray(state.playlists)) {
                    throw new Error('Invalid backup file: missing playlists array');
                }

                importState(state);
            } catch (err) {
                console.error('Failed to import backup:', err);
                alert('Failed to import backup. Please check the file format.');
            }
        };
        reader.readAsText(file);

        // Reset input so the same file can be selected again
        e.target.value = '';
    };

    return (
        <div>
            <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
            />
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button className="p-2 rounded hover:bg-gray-700 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>
                        </svg>
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleImport}>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                            />
                        </svg>
                        Import
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleExport}>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                        </svg>
                        Export
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setSyncDialogOpen(true)}>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
                            />
                        </svg>
                        <span className="flex items-center gap-2">
                            Cloud Sync
                            <span
                                className={`w-2 h-2 rounded-full ${
                                    isConnected ? 'bg-green-500' : 'bg-gray-500'
                                }`}
                            />
                        </span>
                    </DropdownMenuItem>
                    {isConnected && (
                        <DropdownMenuItem onClick={syncNow} disabled={isSyncing}>
                            <svg
                                className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                />
                            </svg>
                            {isSyncing ? 'Syncing...' : 'Sync Now'}
                        </DropdownMenuItem>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>

            <SyncSettingsDialog
                open={syncDialogOpen}
                onOpenChange={setSyncDialogOpen}
                settings={settings}
                isConnected={isConnected}
                isSyncing={isSyncing}
                lastSyncedAt={lastSyncedAt}
                error={error}
                onSave={setCredentials}
                onTestConnection={testConnection}
                onDisconnect={handleDisconnect}
                onEnable={setEnabled}
            />
        </div>
    );

    function handleDisconnect() {
        disconnect();
        clearSettings();
    }
}