export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Metodo non consentito.' })
  const code = String(req.query?.code || '').replace(/\D/g, '')
  if (!/^\d{8,14}$/.test(code)) return res.status(400).json({ error: 'Inserisci un codice a barre valido (8–14 cifre).' })
  try {
    const fields = 'code,product_name,brands,quantity,product_quantity,product_quantity_unit,image_front_url,nutriments,serving_size'
    const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}?fields=${fields}`, {
      headers: { 'User-Agent': 'NutriDay/1.0 (personal nutrition tracker)' }
    })
    if (!response.ok) return res.status(502).json({ error: 'Il database alimentare non è raggiungibile in questo momento.' })
    const data = await response.json()
    if (data.status !== 1 || !data.product) return res.status(404).json({ error: 'Prodotto non trovato. Puoi inserire i valori nutrizionali manualmente.' })
    const p = data.product
    const n = p.nutriments || {}
    const kcal = n['energy-kcal_100g'] ?? n['energy-kcal_value'] ?? (Number.isFinite(n.energy_100g) ? n.energy_100g / 4.184 : null)
    if (kcal == null && n.proteins_100g == null && n.carbohydrates_100g == null && n.fat_100g == null) {
      return res.status(422).json({ error: 'Il prodotto esiste, ma non contiene dati nutrizionali sufficienti.' })
    }
    return res.status(200).json({
      code: p.code || code,
      name: p.product_name || 'Prodotto senza nome',
      brand: p.brands || '',
      quantity: p.quantity || '',
      serving_size: p.serving_size || '',
      image: p.image_front_url || '',
      per100: {
        calories: Number(kcal) || 0,
        protein_g: Number(n.proteins_100g) || 0,
        carbs_g: Number(n.carbohydrates_100g) || 0,
        sugars_g: n.sugars_100g == null ? null : Number(n.sugars_100g),
        fat_g: Number(n.fat_100g) || 0,
        saturated_fat_g: n['saturated-fat_100g'] == null ? null : Number(n['saturated-fat_100g']),
        fiber_g: n.fiber_100g == null ? null : Number(n.fiber_100g),
        salt_g: n.salt_100g == null ? null : Number(n.salt_100g)
      },
      source: 'Open Food Facts'
    })
  } catch (error) {
    console.error('Barcode lookup error:', error)
    return res.status(500).json({ error: 'Errore durante la ricerca del prodotto.' })
  }
}