export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metodo non consentito.' })
  }
  if (!process.env.OPENAI_API_KEY) {
    return res.status(503).json({
      error: 'Analisi foto non configurata: aggiungi OPENAI_API_KEY nelle variabili ambiente di Vercel.'
    })
  }

  try {
    const { image } = req.body || {}
    if (!image || typeof image !== 'string' || !image.startsWith('data:image/')) {
      return res.status(400).json({ error: 'Carica una fotografia valida.' })
    }

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        input: [{
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: `Analizza la foto del cibo e stima la porzione visibile. Rispondi esclusivamente con JSON valido, senza markdown, usando questa struttura:
{"name":"nome breve del pasto","portion_g":"numero intero stimato in grammi","calories":numero,"protein_g":numero,"carbs_g":numero,"fat_g":numero,"confidence":"bassa|media|alta","notes":"breve nota sulle incertezze"}
Stima calorie e macronutrienti per la porzione visibile. Non fingere precisione: una foto non permette di conoscere ingredienti nascosti, olio o peso esatto. Se non è cibo, restituisci un errore JSON {"error":"Non riesco a identificare un alimento nella foto."}.`
            },
            { type: 'input_image', image_url: image }
          ]
        }],
        max_output_tokens: 300
      })
    })

    const payload = await response.json()
    if (!response.ok) {
      console.error('Vision API error:', payload?.error?.message || response.status)
      return res.status(502).json({ error: 'Il servizio di analisi non è riuscito a elaborare la foto. Riprova.' })
    }

    const outputText = (payload.output || [])
      .flatMap(item => item.content || [])
      .filter(item => item.type === 'output_text')
      .map(item => item.text)
      .join('')
    const clean = outputText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
    const result = JSON.parse(clean)
    if (result.error) return res.status(422).json({ error: result.error })

    const numericFields = ['portion_g', 'calories', 'protein_g', 'carbs_g', 'fat_g']
    for (const field of numericFields) {
      if (!Number.isFinite(Number(result[field])) || Number(result[field]) < 0) {
        return res.status(502).json({ error: 'La risposta dell’analisi non è valida. Riprova.' })
      }
      result[field] = Math.round(Number(result[field]) * 10) / 10
    }
    return res.status(200).json(result)
  } catch (error) {
    console.error('Food analysis error:', error)
    return res.status(500).json({ error: 'Errore durante l’analisi. Riprova tra poco.' })
  }
}