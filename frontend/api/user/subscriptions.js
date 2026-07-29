import { createClient } from '@supabase/supabase-js';
import { verifyToken } from '../_jwt.js';
import { sendConfirmationEmail } from '../_confirmationEmail.js';

export default async function handler(req, res) {
  // Extract Authorization header
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();

  // Verify JWT session token
  const payload = verifyToken(token);
  if (!payload || !payload.email) {
    return res.status(401).json({ error: 'Unauthorized. Session token is missing, invalid, or expired.' });
  }

  const userEmail = payload.email;

  // Initialize Supabase Client with service_role key to bypass RLS
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // GET: Fetch user's subscriptions
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('email', userEmail)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return res.status(200).json({ success: true, subscriptions: data || [], email: userEmail });
    } catch (err) {
      console.error('Error fetching user subscriptions:', err);
      return res.status(500).json({ error: 'Failed to fetch subscriptions' });
    }
  }

  // POST: Create a new subscription record for the authenticated user without OTP
  if (req.method === 'POST') {
    const { locations, weekdays, start_time_min, start_time_max } = req.body || {};

    if (!locations || !Array.isArray(locations) || locations.length === 0) {
      return res.status(400).json({ error: 'Please select at least one location' });
    }
    if (!weekdays || !Array.isArray(weekdays) || weekdays.length === 0) {
      return res.status(400).json({ error: 'Please select at least one weekday' });
    }

    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .insert({
          email: userEmail,
          locations,
          weekdays,
          start_time_min: start_time_min || '00:00:00',
          start_time_max: start_time_max || '23:59:59',
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      // Fetch all active rules for this user email
      const { data: allUserRules } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('email', userEmail)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      // Send immediate Confirmation Email (Scenario B)
      try {
        await sendConfirmationEmail({
          email: userEmail,
          currentRule: data,
          allRules: allUserRules || [],
          type: 'created'
        });
      } catch (err) {
        console.error('Error sending Scenario B confirmation email:', err);
      }

      return res.status(201).json({ success: true, subscription: data });
    } catch (err) {
      console.error('Error creating user subscription:', err);
      return res.status(500).json({ error: 'Failed to create subscription' });
    }
  }

  // PUT: Update a specific subscription record

  if (req.method === 'PUT') {
    const { id, locations, weekdays, start_time_min, start_time_max, is_active } = req.body;
    if (!id) {
      return res.status(400).json({ error: 'Subscription ID is required' });
    }

    if (locations !== undefined && (!Array.isArray(locations) || locations.length === 0)) {
      return res.status(400).json({ error: 'Please select at least one location' });
    }
    if (weekdays !== undefined && (!Array.isArray(weekdays) || weekdays.length === 0)) {
      return res.status(400).json({ error: 'Please select at least one weekday' });
    }

    try {
      const updateData = {};
      if (locations !== undefined) updateData.locations = locations;
      if (weekdays !== undefined) updateData.weekdays = weekdays;
      if (start_time_min !== undefined) updateData.start_time_min = start_time_min;
      if (start_time_max !== undefined) updateData.start_time_max = start_time_max;
      if (is_active !== undefined) updateData.is_active = is_active;

      const { data, error } = await supabase
        .from('subscriptions')
        .update(updateData)
        .eq('id', id)
        .eq('email', userEmail)
        .select()
        .single();

      if (error) throw error;

      // Fetch all active rules for this user email
      const { data: allUserRules } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('email', userEmail)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      // Send immediate Rule Updated Email (Scenario C)
      try {
        await sendConfirmationEmail({
          email: userEmail,
          currentRule: data,
          allRules: allUserRules || [],
          type: 'updated'
        });
      } catch (err) {
        console.error('Error sending rule update email:', err);
      }

      return res.status(200).json({ success: true, subscription: data });
    } catch (err) {
      console.error('Error updating subscription:', err);
      return res.status(500).json({ error: 'Failed to update subscription' });
    }
  }

  // DELETE: Delete a specific subscription record
  if (req.method === 'DELETE') {
    const { id } = req.body || req.query;
    if (!id) {
      return res.status(400).json({ error: 'Subscription ID is required' });
    }

    try {
      const { error } = await supabase
        .from('subscriptions')
        .delete()
        .eq('id', id)
        .eq('email', userEmail);

      if (error) throw error;
      return res.status(200).json({ success: true });
    } catch (err) {
      console.error('Error deleting subscription:', err);
      return res.status(500).json({ error: 'Failed to delete subscription' });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
