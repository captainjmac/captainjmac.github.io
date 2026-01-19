import { createClient, type SupabaseClient, type Session } from '@supabase/supabase-js';
import type { AppState } from '@/types';
import type { StorageAdapter } from './types';

const TABLE_NAME = 'isotube_state';

interface IsotubeStateRow {
    id: string;
    user_id: string;
    state: AppState;
    updated_at: string;
}

export class SupabaseAdapter implements StorageAdapter {
    private client: SupabaseClient;
    private session: Session | null = null;

    constructor(url: string, anonKey: string) {
        this.client = createClient(url, anonKey, {
            auth: {
                persistSession: true,
                storageKey: 'isotube-supabase-auth',
            },
        });
    }

    async initialize(): Promise<boolean> {
        try {
            // Try to get existing session
            const { data: { session } } = await this.client.auth.getSession();

            if (session) {
                this.session = session;
                return true;
            }

            // No existing session, sign in anonymously
            const { data, error } = await this.client.auth.signInAnonymously();

            if (error) {
                console.error('Supabase anonymous auth failed:', error);
                return false;
            }

            this.session = data.session;
            return true;
        } catch (error) {
            console.error('Supabase initialization failed:', error);
            return false;
        }
    }

    async testConnection(): Promise<{ success: boolean; error?: string }> {
        try {
            // First ensure we're authenticated
            const initialized = await this.initialize();
            if (!initialized) {
                return { success: false, error: 'Failed to authenticate with Supabase' };
            }

            // Try a simple query to test the connection
            const { error } = await this.client
                .from(TABLE_NAME)
                .select('id')
                .limit(1);

            if (error) {
                // Check for common errors
                if (error.message.includes('relation') && error.message.includes('does not exist')) {
                    return {
                        success: false,
                        error: 'Table "isotube_state" not found. Please run the setup SQL in your Supabase project.',
                    };
                }
                return { success: false, error: error.message };
            }

            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    async load(): Promise<AppState | null> {
        try {
            if (!this.session) {
                const initialized = await this.initialize();
                if (!initialized) return null;
            }

            const { data, error } = await this.client
                .from(TABLE_NAME)
                .select('state, updated_at')
                .eq('user_id', this.session!.user.id)
                .order('updated_at', { ascending: false })
                .limit(1)
                .single();

            if (error) {
                // No rows found is not an error for us
                if (error.code === 'PGRST116') {
                    return null;
                }
                console.error('Supabase load error:', error);
                return null;
            }

            return (data as IsotubeStateRow).state;
        } catch (error) {
            console.error('Supabase load failed:', error);
            return null;
        }
    }

    async save(state: AppState): Promise<void> {
        try {
            if (!this.session) {
                const initialized = await this.initialize();
                if (!initialized) {
                    throw new Error('Not authenticated');
                }
            }

            const { error } = await this.client
                .from(TABLE_NAME)
                .upsert(
                    {
                        user_id: this.session!.user.id,
                        state: state,
                        updated_at: new Date().toISOString(),
                    },
                    {
                        onConflict: 'user_id',
                    }
                );

            if (error) {
                console.error('Supabase save error:', error);
                throw error;
            }
        } catch (error) {
            console.error('Supabase save failed:', error);
            throw error;
        }
    }

    async getLastSyncTime(): Promise<Date | null> {
        try {
            if (!this.session) {
                const initialized = await this.initialize();
                if (!initialized) return null;
            }

            const { data, error } = await this.client
                .from(TABLE_NAME)
                .select('updated_at')
                .eq('user_id', this.session!.user.id)
                .limit(1)
                .single();

            if (error || !data) return null;

            return new Date((data as IsotubeStateRow).updated_at);
        } catch {
            return null;
        }
    }

    async signOut(): Promise<void> {
        await this.client.auth.signOut();
        this.session = null;
    }

    getUserId(): string | null {
        return this.session?.user.id ?? null;
    }
}

// SQL setup script for users to run in their Supabase project
export const SUPABASE_SETUP_SQL = `
-- Create the isotube_state table
create table if not exists isotube_state (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  state jsonb not null,
  updated_at timestamptz default now()
);

-- Enable Row Level Security
alter table isotube_state enable row level security;

-- Policy: Users can read their own state
create policy "Users can read own state"
  on isotube_state for select
  using (auth.uid() = user_id);

-- Policy: Users can insert their own state
create policy "Users can insert own state"
  on isotube_state for insert
  with check (auth.uid() = user_id);

-- Policy: Users can update their own state
create policy "Users can update own state"
  on isotube_state for update
  using (auth.uid() = user_id);

-- Create index for faster lookups
create index if not exists isotube_state_user_id_idx on isotube_state(user_id);
`;
