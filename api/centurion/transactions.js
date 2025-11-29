import QRCode from "qrcode"

export default async function handler(req, res) {
  // CORS
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*")
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization")
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS")
    return res.status(200).end()
  }
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS")
    return res.status(405).json({ error: "Method not allowed" })
  }
  res.setHeader("Access-Control-Allow-Origin", "*")

  try {
    const SECRET = process.env.CENTURION_SECRET_KEY
    if (!SECRET) {
      return res.status(500).json({ error: "CENTURION_SECRET_KEY não configurada" })
    }

    const auth = "Basic " + Buffer.from(`${SECRET}:x`).toString("base64")
    const payload = req.body && Object.keys(req.body).length ? req.body : {}

    const gwRes = await fetch("https://api.centurionpay.com.br/functions/v1/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json", authorization: auth },
      body: JSON.stringify(payload),
    })

    const data = await gwRes.json()

    // Gera imagem do QR a partir do EMV
    const emv = data?.pix?.qrcode || data?.pix?.emv || null
    if (emv) {
      const dataUrl = await QRCode.toDataURL(emv, { width: 320, errorCorrectionLevel: "M" })
      data.qr_code_copy = emv
      data.qr_code_base64 = dataUrl.replace("data:image/png;base64,", "")
    }

    return res.status(gwRes.status).json(data)
  } catch (err) {
    console.error("Erro no proxy Centurion:", err)
    return res.status(500).json({ error: "Erro interno no proxy", details: String(err) })
  }
}
