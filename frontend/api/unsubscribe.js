import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // Reject non-POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { email } = req.body;

  // Simple validation
  if (!email) {
    return res.status(400).json({ error: 'Email address is required to unsubscribe' });
  }

  try {
    // Initialize Supabase Client with service_role key to bypass RLS and delete records
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Delete official subscriptions for this email
    // This will trigger database cascade delete to clean up alert_history automatically
    const { error: subError } = await supabase
      .from('subscriptions')
      .delete()
      .eq('email', email);

    if (subError) {
      console.error('Database error during unsubscribe:', subError);
      return res.status(500).json({ error: 'Failed to process unsubscribe request' });
    }

    // Clean up any pending verification records for this email
    await supabase
      .from('subscription_verifications')
      .delete()
      .eq('email', email);

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Server error during unsubscribe:', err);
    return res.status(500).json({ error: 'Failed to process unsubscribe' });
  }
}
