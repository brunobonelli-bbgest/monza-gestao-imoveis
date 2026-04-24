import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || 'https://cozmxgfbhqpiwnppulzl.supabase.co';
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_ouT8JPzYiyY0e0r1q8QIJQ_gar0rEHs';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
