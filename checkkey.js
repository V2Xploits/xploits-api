import { createClient } from '@supabase/supabase-js'
 
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)
 
export default async function handler(req, res) {
  const key = req.query.key?.toUpperCase()
  if (!key) return res.status(400).send('invalid')
 
  const { data } = await supabase
    .from('keys')
    .select('expiry')
    .eq('key', key)
    .single()
 
  if (!data) return res.send('invalid')
  if (data.expiry !== -1 && Date.now() > data.expiry) return res.send('expired')
  return res.send('valid')
}
 