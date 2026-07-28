import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // Reject non-POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { token } = req.body;

  // Simple validation
  if (!token) {
    return res.status(400).json({ error: 'Verification token is required' });
  }

  try {
    // Initialize Supabase Client with service_role key to bypass RLS and delete records
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Delete official subscriptions for this security token
    // This will trigger database cascade delete to clean up alert_history automatically
    const { data: subData, error: subError } = await supabase
      .from('subscriptions')
      .delete()
      .eq('unsubscribe_token', token)
      .select('email');

    if (subError) {
      console.error('Database error during unsubscribe:', subError);
      return res.status(500).json({ error: 'Failed to process unsubscribe request' });
    }

    if (!subData || subData.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired unsubscribe link' });
    }

    const unsubscribedEmail = subData[0]?.email;
    if (unsubscribedEmail) {
      // Clean up any pending verification records for this email
      await supabase
        .from('subscription_verifications')
        .delete()
        .eq('email', unsubscribedEmail);
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Server error during unsubscribe:', err);
    return res.status(500).json({ error: 'Failed to process unsubscribe' });
  }
}

