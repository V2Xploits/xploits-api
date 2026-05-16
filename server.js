const express = require('express')
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const app = express()
app.use(express.json())

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

const ADMIN_SECRET = process.env.ADMIN_SECRET
const BASE_URL     = process.env.BASE_URL

function getStatus(row) {
  if (!row) return 'invalid'
  if (row.expiry !== -1 && Date.now() > row.expiry) return 'expired'
  return 'valid'
}

app.get('/checkkey', async (req, res) => {
  const key = req.query.key?.toUpperCase()
  if (!key) return res.send('invalid')

  const { data } = await supabase
    .from('keys')
    .select('expiry')
    .eq('key', key)
    .single()

  return res.send(getStatus(data))
})

app.get('/getexpiry', async (req, res) => {
  const key = req.query.key?.toUpperCase()
  if (!key) return res.send('invalid')

  const { data } = await supabase
    .from('keys')
    .select('expiry')
    .eq('key', key)
    .single()

  if (!data) return res.send('invalid')
  if (data.expiry === -1) return res.send('never')
  return res.send(new Date(data.expiry).toISOString())
})

app.get('/script', async (req, res) => {
  const key = req.query.key?.toUpperCase()
  if (!key) return res.status(400).send('-- Error: no key provided')

  const { data } = await supabase
    .from('keys')
    .select('expiry')
    .eq('key', key)
    .single()

  const status = getStatus(data)
  if (status !== 'valid') {
    return res.status(403).send(`-- Error: key is ${status}`)
  }

  const lua = `script_key = "${key}"\nloadstring(game:HttpGet("${BASE_URL}/loader"))()`

  res.setHeader('Content-Type', 'text/plain')
  return res.send(lua)
})

app.get('/loader', async (req, res) => {
  const lua = fs.readFileSync(path.join(__dirname, 'loader.lua'), 'utf8')
  res.setHeader('Content-Type', 'text/plain')
  return res.send(lua)
})

app.post('/keys/create', async (req, res) => {
  const auth = req.headers['authorization']
  if (auth !== `Bearer ${ADMIN_SECRET}`) {
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
})

app.post('/keys/redeem', async (req, res) => {
  const { key, user_id } = req.body
  const upperKey = key?.toUpperCase()

  const { data } = await supabase
    .from('keys')
    .select('*')
    .eq('key', upperKey)
    .single()

  const status = getStatus(data)
  if (status !== 'valid') return res.send(status)

  if (data.redeemed_by && data.redeemed_by !== user_id) {
    return res.send('taken')
  }

  await supabase.from('keys').update({ redeemed_by: user_id }).eq('key', upperKey)
  return res.send('valid')
})

app.get('/keys/user', async (req, res) => {
  const user_id = req.query.user_id
  if (!user_id) return res.send('invalid')

  const { data } = await supabase
    .from('keys')
    .select('key, expiry')
    .eq('redeemed_by', user_id)
    .single()

  if (!data) return res.send('none')
  if (data.expiry !== -1 && Date.now() > data.expiry) return res.send('expired')
  return res.send(data.key)
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`API running on port ${PORT}`))
