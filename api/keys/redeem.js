import { createClient } from '@supabase/supabase-js'
 
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)
 
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method not allowed')
 
  const { key, user_id } = req.body
  const upperKey = key?.toUpperCase()
 
  const { data } = await supabase
    .from('keys')
    .select('*')
    .eq('key', upperKey)
    .single()
 
  if (!data) return res.send('invalid')
  if (data.expiry !== -1 && Date.now() > data.expiry) return res.send('expired')
 
  if (data.redeemed_by && data.redeemed_by !== user_id) {
    return res.send('taken')
  }
 
  await supabase.from('keys').update({ redeemed_by: user_id }).eq('key', upperKey)
 
  return res.send('valid')
}
