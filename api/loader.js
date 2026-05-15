export default async function handler(req, res) {
  const lua = `-- =======================================
--   Main Script
--   Loaded after key validation
-- =======================================
 
-- Your script logic goes here
print("Script loaded successfully!")
`
 
  res.setHeader('Content-Type', 'text/plain')
  return res.send(lua)
}
 
