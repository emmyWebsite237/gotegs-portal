// api/admin-verify.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const { name, pin } = req.query;

  const { data, error } = await supabase
    .from('admin_portal')
    .select('*')
    .eq('admin_name', name)
    .eq('pin_code', pin)
    .single();

  if (error || !data) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  return res.status(200).json({ success: true });
}
