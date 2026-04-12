// api/get-section-results.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const { section } = req.query;

  // This calls the SQL function we created earlier
  const { data, error } = await supabase.rpc('get_bulk_results', {
    target_section: section
  });

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json(data);
}
