// pages/api/centurion/transactions.js
const QRCode = require('qrcode')

export default async function handler(req, res) {
  // CORS básico
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

    // Payload que veio do front
    const payload = req.body && Object.keys(req.body).length ? req.body : {}

    // Auth básico da Centurion
    const auth = 'Basic ' + Buffer.from(`${SECRET_KEY}:x`).toString('base64')

    // Chama a Centurion
    const gwRes = await fetch('https://api.centurionpay.com.br/functions/v1/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', authorization: auth },
      body: JSON.stringify(payload),
    })

    const data = await gwRes.json()

    // Se veio Pix OK, converte pro formato que seu site espera
    if (gwRes.ok && data?.pix?.qrcode) {
      const qr_code_copy = data.pix.qrcode
      const dataUrl = await QRCode.toDataURL(qr_code_copy, { margin: 1, width: 256 })
      const qr_code_base64 = String(dataUrl).split(',')[1] // remove "data:image/png;base64,"

      return res.status(200).json({ qr_code_copy, qr_code_base64 })
    }

    // Senão, devolve o que a Centurion mandou (ajuda a ver recusas)
    return res.status(gwRes.status).json(data)
  } catch (err) {
    console.error('Erro no proxy Centurion:', err)
    return res.status(500).json({ error: 'Erro interno no proxy', details: String(err) })
  }
}
