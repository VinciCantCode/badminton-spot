import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // Reject non-POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { email, code } = req.body;

  // Simple validation
  if (!email || !code) {
    return res.status(400).json({ error: 'Email and verification code are required' });
  }

  try {
    // Initialize Supabase Client with service_role key to bypass RLS
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Look up the verification record and verify it hasn't expired
    const { data: record, error: findError } = await supabase
      .from('subscription_verifications')
      .select('*')
      .eq('email', email)
      .eq('code', code.trim())
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (findError || !record) {
      return res.status(400).json({ error: 'Invalid or expired verification code' });
    }

    // Insert the verified parameters into the official subscriptions table
    const { error: insertError } = await supabase
      .from('subscriptions')
      .insert({
        email,
        locations: record.locations,
        weekdays: record.weekdays,
        start_time_min: record.start_time_min,
        start_time_max: record.start_time_max,
        is_active: true
      });

    if (insertError) {
      console.error('Database error inserting official subscription:', insertError);
      return res.status(500).json({ error: 'Failed to save subscription' });
    }

    // Clean up/delete the verification record so it cannot be reused
    await supabase
      .from('subscription_verifications')
      .delete()
      .eq('email', email);

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Server error during code verification:', err);
    return res.status(500).json({ error: 'Failed to process code verification' });
  }
}
