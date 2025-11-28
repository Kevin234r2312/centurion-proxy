export default async function handler(req, res) {
  // Preflight CORS
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  res.setHeader('Access-Control-Allow-Origin', '*')

  try {
    const SECRET_KEY = process.env.CENTURION_SECRET_KEY
    if (!SECRET_KEY) {
      return res.status(500).json({ error: 'CENTURION_SECRET_KEY não configurada' })
    }

    const auth = 'Basic ' + Buffer.from(`${SECRET_KEY}:x`).toString('base64')

    const payload = req.body && Object.keys(req.body).length ? req.body : {}

    // LOGS ÚTEIS (veja no dashboard do Vercel > Functions)
    console.log('🚀 Payload enviado p/ Centaurion:', JSON.stringify(payload, null, 2))

    const gwRes = await fetch('https://api.centurionpay.com.br/functions/v1/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', authorization: auth },
      body: JSON.stringify(payload),
    })

    const data = await gwRes.json()
    console.log('✅ Resposta Centaurion:', gwRes.status, JSON.stringify(data, null, 2))

    return res.status(gwRes.status).json(data)
  } catch (err) {
    console.error('❌ Erro no proxy Centurion:', err)
    return res.status(500).json({ error: 'Erro interno no proxy', details: String(err) })
  }
}
