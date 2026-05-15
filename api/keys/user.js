import { createClient } from '@supabase/supabase-js'
 
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)
 
export default async function handler(req, res) {
  const user_id = req.query.user_id
  if (!user_id) return res.status(400).send('invalid')
 
  const { data } = await supabase
    .from('keys')
    .select('key, expiry')
    .eq('redeemed_by', user_id)
    .single()
 
  if (!data) return res.send('none')
  if (data.expiry !== -1 && Date.now() > data.expiry) return res.send('expired')
  return res.send(data.key)
}
 
