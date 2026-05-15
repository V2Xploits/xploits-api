import { createClient } from '@supabase/supabase-js'
 
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)
 
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method not allowed')
 
  const auth = req.headers['authorization']
  if (auth !== `Bearer ${process.env.ADMIN_SECRET}`) {
    return res.status(401).send('Unauthorized')
  }
 
  const { key, expiry, note, created_by } = req.body
 
  const { error } = await supabase.from('keys').insert({
    key,
    expiry,
    note: note || null,
    created_at: Date.now(),
    created_by,
    redeemed_by: null,
  })
 
  if (error) return res.status(500).json({ error: error.message })
  return res.status(200).json({ ok: true })
}
 
