import { createClient } from '@supabase/supabase-js'
 
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)
 
const BASE_URL = 'https://YOUR-PROJECT.lovable.app'
 
export default async function handler(req, res) {
  const key = req.query.key?.toUpperCase()
  if (!key) return res.status(400).send('-- Error: no key provided')
 
  const { data } = await supabase
    .from('keys')
    .select('expiry')
    .eq('key', key)
    .single()
 
  if (!data) return res.status(403).send('-- Error: invalid key')
  if (data.expiry !== -1 && Date.now() > data.expiry) {
    return res.status(403).send('-- Error: key expired')
  }
 
  const lua = `-- =======================================
--   Script Loader
--   Key: ${key}
--   Do NOT share this with anyone.
-- =======================================
 
local script_key = "${key}"
 
-- Validate key before running
local status = game:HttpGet("${BASE_URL}/api/checkkey?key=" .. script_key)
if status ~= "valid" then
    return warn("[Loader] Your key is " .. status .. ". Please contact support.")
end
 
-- Load the main script
loadstring(game:HttpGet("${BASE_URL}/api/loader"))()
`
 
  res.setHeader('Content-Type', 'text/plain')
  return res.send(lua)
}
 
