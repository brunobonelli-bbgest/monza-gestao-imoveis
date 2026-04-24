import express from 'express';
import { createServer as createViteServer } from 'vite';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  /**
   * Expected 'profiles' table structure:
   * - id: uuid (pk, matches auth.users.id)
   * - name: text
   * - username: text (unique)
   * - role: text
   * - permissions: array
   * - created_at: timestamp
   */

  const mapRole = (role: string): string => {
    const roleMap: Record<string, string> = {
      'admin': 'admin',
      'manager': 'manager',
      'staff': 'user',
      'user': 'user',
      'operacional': 'user',
      'financeiro': 'manager'
    };
    return roleMap[role] || 'user';
  };

  // API Route for creating users securely
  app.post('/api/users/create', async (req, res) => {
    const { email, password, name, username, role, permissions } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const dbRole = mapRole(role);

    try {
      // 1. Create user in Supabase Auth using Admin API
      let { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirm email
        user_metadata: { name, username, role: dbRole }
      });

      if (authError) {
        // If user already exists, try to get their ID to sync the profile
        if (authError.message.includes('already registered') || authError.message.includes('already exists')) {
          const { data: existingUser, error: getError } = await supabaseAdmin.auth.admin.getUserByEmail(email);
          if (getError || !existingUser?.user) {
            return res.status(400).json({ error: authError.message });
          }
          authData = { user: existingUser.user } as any;
        } else {
          console.error('Auth Error:', authError);
          return res.status(400).json({ error: authError.message });
        }
      }

      const authUserId = authData!.user.id;
      console.log(`[Server] Auth user created/found: ${authUserId}. Syncing profile with role: ${dbRole}...`);

      // 2. Create or Update profile in the database (Upsert)
      // This ensures that even if the user existed in Auth but not in Profiles, it gets created now.
      const { data: profileData, error: profileError } = await supabaseAdmin
        .from('profiles')
        .upsert({
          id: authUserId,
          name: name,
          username,
          role: dbRole,
          permissions: permissions || ['read'],
          created_at: new Date().toISOString()
        }, { onConflict: 'id' })
        .select()
        .single();

      if (profileError) {
        console.error('[Server] Profile Sync Error:', profileError);
        return res.status(400).json({ error: profileError.message });
      }

      console.log('[Server] Profile synced successfully:', profileData.id);

      res.status(201).json({ 
        user: authData!.user, 
        profile: profileData 
      });
    } catch (error: any) {
      console.error('Server Error:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  });

  // API Route for resolving username to email
  app.get('/api/users/get-email/:username', async (req, res) => {
    const { username } = req.params;
    try {
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('username', username)
        .maybeSingle();

      if (error || !data) {
        return res.status(404).json({ error: 'User not found' });
      }

      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(data.id);
      if (authError || !authUser) {
        return res.status(404).json({ error: 'Auth user not found' });
      }

      res.json({ email: authUser.user.email });
    } catch (error: any) {
      console.error('Server Error:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  });

  // API Route for listing users securely
  app.get('/api/users/list', async (req, res) => {
    try {
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      console.error('Server Error:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  });

  // API Route for updating users securely
  app.put('/api/users/update/:id', async (req, res) => {
    const { id } = req.params;
    const { name, username, role, permissions } = req.body;
    const dbRole = mapRole(role);
    try {
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .update({ name, username, role: dbRole, permissions })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      console.error('Server Error:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  });

  // API Route for deleting users securely
  app.delete('/api/users/delete/:id', async (req, res) => {
    const { id } = req.params;
    try {
      const { error } = await supabaseAdmin
        .from('profiles')
        .delete()
        .eq('id', id);
      if (error) throw error;
      res.json({ status: 'ok' });
    } catch (error: any) {
      console.error('Server Error:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
