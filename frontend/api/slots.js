import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // Allow CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Set Edge Caching with stale-while-revalidate policy
  // s-maxage=10: Fresh in Vercel Edge CDN cache for 10 seconds (served in <15ms)
  // stale-while-revalidate=59: Serve stale cache instantly while revalidating fresh data in background
  res.setHeader(
    'Cache-Control',
    'public, max-age=0, s-maxage=10, stale-while-revalidate=59'
  );

  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: 'Database environment variables missing' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .from('slots')
      .select('*')
      .order('start_time', { ascending: true });

    if (error) {
      console.error('Database query error in /api/slots:', error);
      return res.status(500).json({ error: 'Failed to query slots from database' });
    }

    return res.status(200).json(data || []);
  } catch (err) {
    console.error('Unhandled error in /api/slots endpoint:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
