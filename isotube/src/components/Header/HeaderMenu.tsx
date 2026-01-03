import {useRef} from 'react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {usePlaylistsContext} from '@/hooks/PlaylistsContext';
import type {AppState} from '@/types';

export function HeaderMenu() {
    const {exportState, importState} = usePlaylistsContext();
    const fileInputRef = useRef<HTMLInputElement>(null);

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
        <div className="ml-auto">
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
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}