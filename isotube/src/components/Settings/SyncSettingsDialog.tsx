import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { SUPABASE_SETUP_SQL } from '@/storage/SupabaseAdapter';
import type { SyncSettings } from '@/storage/types';

interface SyncSettingsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    settings: SyncSettings;
    isConnected: boolean;
    isSyncing: boolean;
    lastSyncedAt: Date | null;
    error: string | null;
    onSave: (url: string, anonKey: string) => void;
    onTestConnection: (url: string, anonKey: string) => Promise<{ success: boolean; error?: string }>;
    onDisconnect: () => void;
    onEnable: (enabled: boolean) => void;
}

type TabType = 'settings' | 'setup';

export function SyncSettingsDialog({
    open,
    onOpenChange,
    settings,
    isConnected,
    isSyncing,
    lastSyncedAt,
    error,
    onSave,
    onTestConnection,
    onDisconnect,
    onEnable,
}: SyncSettingsDialogProps) {
    const [activeTab, setActiveTab] = useState<TabType>('settings');
    const [url, setUrl] = useState(settings.supabaseUrl);
    const [anonKey, setAnonKey] = useState(settings.supabaseAnonKey);
    const [testResult, setTestResult] = useState<{ success: boolean; error?: string } | null>(null);
    const [isTesting, setIsTesting] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleTest = async () => {
        setIsTesting(true);
        setTestResult(null);
        const result = await onTestConnection(url, anonKey);
        setTestResult(result);
        setIsTesting(false);
    };

    const handleSave = () => {
        onSave(url, anonKey);
        onEnable(true);
        onOpenChange(false);
    };

    const handleDisconnect = () => {
        onDisconnect();
        onEnable(false);
        setTestResult(null);
    };

    const handleCopySQL = async () => {
        await navigator.clipboard.writeText(SUPABASE_SETUP_SQL);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const formatLastSync = (date: Date | null) => {
        if (!date) return 'Never';
        return date.toLocaleString();
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
                            />
                        </svg>
                        Cloud Sync Settings
                    </DialogTitle>
                    <DialogDescription>
                        Sync your playlists across devices using your own Supabase project.
                    </DialogDescription>
                </DialogHeader>

                {/* Tabs */}
                <div className="flex border-b border-gray-700">
                    <button
                        className={`px-4 py-2 text-sm font-medium transition-colors ${
                            activeTab === 'settings'
                                ? 'text-white border-b-2 border-blue-500'
                                : 'text-gray-400 hover:text-white'
                        }`}
                        onClick={() => setActiveTab('settings')}
                    >
                        Settings
                    </button>
                    <button
                        className={`px-4 py-2 text-sm font-medium transition-colors ${
                            activeTab === 'setup'
                                ? 'text-white border-b-2 border-blue-500'
                                : 'text-gray-400 hover:text-white'
                        }`}
                        onClick={() => setActiveTab('setup')}
                    >
                        Setup Guide
                    </button>
                </div>

                {activeTab === 'settings' && (
                    <div className="space-y-4">
                        {/* Connection Status */}
                        <div className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
                            <div className="flex items-center gap-2">
                                <div
                                    className={`w-2 h-2 rounded-full ${
                                        isConnected ? 'bg-green-500' : 'bg-gray-500'
                                    }`}
                                />
                                <span className="text-sm">
                                    {isConnected ? 'Connected' : 'Not connected'}
                                </span>
                            </div>
                            {isSyncing && (
                                <span className="text-xs text-gray-400 animate-pulse">
                                    Syncing...
                                </span>
                            )}
                        </div>

                        {isConnected && (
                            <div className="text-xs text-gray-400">
                                Last synced: {formatLastSync(lastSyncedAt)}
                            </div>
                        )}

                        {error && (
                            <div className="p-3 bg-red-900/50 border border-red-700 rounded-lg text-sm text-red-200">
                                {error}
                            </div>
                        )}

                        {/* Credentials Form */}
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                    Supabase Project URL
                                </label>
                                <input
                                    type="url"
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    placeholder="https://your-project.supabase.co"
                                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    disabled={isConnected}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                    Anon/Public Key
                                </label>
                                <input
                                    type="password"
                                    value={anonKey}
                                    onChange={(e) => setAnonKey(e.target.value)}
                                    placeholder="eyJhbGciOiJIUzI1..."
                                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    disabled={isConnected}
                                />
                            </div>
                        </div>

                        {/* Test Result */}
                        {testResult && (
                            <div
                                className={`p-3 rounded-lg text-sm ${
                                    testResult.success
                                        ? 'bg-green-900/50 border border-green-700 text-green-200'
                                        : 'bg-red-900/50 border border-red-700 text-red-200'
                                }`}
                            >
                                {testResult.success
                                    ? 'Connection successful!'
                                    : `Connection failed: ${testResult.error}`}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'setup' && (
                    <div className="space-y-4 text-sm">
                        <div className="space-y-2 text-gray-300">
                            <h4 className="font-medium text-white">Quick Setup Guide</h4>
                            <ol className="list-decimal list-inside space-y-2">
                                <li>
                                    Go to{' '}
                                    <a
                                        href="https://supabase.com"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-400 hover:underline"
                                    >
                                        supabase.com
                                    </a>{' '}
                                    and create a free account
                                </li>
                                <li>Create a new project (choose any region near you)</li>
                                <li>
                                    Go to <strong>Authentication → Settings</strong> and enable{' '}
                                    <strong>Anonymous sign-ins</strong>
                                </li>
                                <li>
                                    Go to <strong>SQL Editor</strong> and run the SQL below
                                </li>
                                <li>
                                    Go to <strong>Settings → API</strong> and copy:
                                    <ul className="list-disc list-inside ml-4 mt-1">
                                        <li>Project URL</li>
                                        <li>anon/public key</li>
                                    </ul>
                                </li>
                                <li>Paste the credentials in the Settings tab and connect</li>
                            </ol>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium text-white">Required SQL</h4>
                                <button
                                    onClick={handleCopySQL}
                                    className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
                                >
                                    {copied ? 'Copied!' : 'Copy SQL'}
                                </button>
                            </div>
                            <pre className="p-3 bg-gray-900 rounded-lg text-xs text-gray-300 overflow-x-auto max-h-48">
                                {SUPABASE_SETUP_SQL}
                            </pre>
                        </div>
                    </div>
                )}

                <DialogFooter>
                    {isConnected ? (
                        <button
                            onClick={handleDisconnect}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md text-white text-sm transition-colors"
                        >
                            Disconnect
                        </button>
                    ) : (
                        <div className="flex gap-2">
                            <button
                                onClick={handleTest}
                                disabled={!url || !anonKey || isTesting}
                                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-md text-white text-sm transition-colors"
                            >
                                {isTesting ? 'Testing...' : 'Test Connection'}
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={!url || !anonKey || (testResult !== null && !testResult.success)}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md text-white text-sm transition-colors"
                            >
                                Connect & Enable Sync
                            </button>
                        </div>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
