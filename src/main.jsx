import React, { useEffect, useMemo, useRef, useState } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'
import { createRoot } from 'react-dom/client'
import {
  Activity, Apple, ArrowDownToLine, Barcode, Camera, Check, ChevronLeft, ChevronRight,
  CircleHelp, Flame, ImagePlus, Leaf, Plus, Search, Settings2, Sparkles,
  Trash2, Utensils, X
} from 'lucide-react'
import './styles.css'

const todayKey = () => new Date().toLocaleDateString('sv-SE')
const starterGoals = { calories: 2200, protein: 140, carbs: 250, fat: 70 }
const mealTypes = ['Colazione', 'Pranzo', 'Cena', 'Spuntini']
const sampleFoods = [
  { name: 'Yogurt greco 0%', portion_g: 170, calories: 100, protein_g: 17, carbs_g: 6, fat_g: 0.7 },
  { name: 'Banana', portion_g: 120, calories: 107, protein_g: 1.3, carbs_g: 27, fat_g: 0.4 },
  { name: 'Petto di pollo cotto', portion_g: 150, calories: 248, protein_g: 46.5, carbs_g: 0, fat_g: 5.4 },
  { name: 'Riso basmati cotto', portion_g: 180, calories: 234, protein_g: 4.9, carbs_g: 50.8, fat_g: 0.7 },
  { name: 'Uovo', portion_g: 60, calories: 86, protein_g: 7.5, carbs_g: 0.4, fat_g: 5.7 },
  { name: 'Mela', portion_g: 150, calories: 78, protein_g: 0.4, carbs_g: 20.7, fat_g: 0.3 },
  { name: 'Pane integrale', portion_g: 50, calories: 124, protein_g: 4.5, carbs_g: 21, fat_g: 1.8 },
  { name: 'Mandorle', portion_g: 20, calories: 116, protein_g: 4.2, carbs_g: 4.3, fat_g: 10 }
]
const fmt = n => Math.round(Number(n) || 0).toLocaleString('it-IT')
const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
const load = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback } catch { return fallback }
}
function App() {
  const [date, setDate] = useState(todayKey())
  const [logs, setLogs] = useState(() => load('nutriday-logs', {}))
  const [goals, setGoals] = useState(() => load('nutriday-goals', starterGoals))
  const [modal, setModal] = useState('')
  const [meal, setMeal] = useState('Colazione')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(null)
  const [portion, setPortion] = useState('100')
  const [custom, setCustom] = useState({ name: '', portion_g: '100', calories: '', protein_g: '', carbs_g: '', fat_g: '' })
  const [photo, setPhoto] = useState(null)
  const [analysis, setAnalysis] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState('')
  const [editingGoals, setEditingGoals] = useState(goals)
  const fileRef = useRef(null)
  const videoRef = useRef(null)
  const scannerControls = useRef(null)
  const [barcode, setBarcode] = useState('')
  const [barcodeLoading, setBarcodeLoading] = useState(false)
  const [barcodeProduct, setBarcodeProduct] = useState(null)
  const [scannerError, setScannerError] = useState('')

  useEffect(() => { localStorage.setItem('nutriday-logs', JSON.stringify(logs)) }, [logs])
  useEffect(() => {
    if (modal !== 'barcode') {
      try { scannerControls.current?.stop() } catch {}
      scannerControls.current = null
    }
    return () => {
      try { scannerControls.current?.stop() } catch {}
      scannerControls.current = null
    }
  }, [modal])
  useEffect(() => { localStorage.setItem('nutriday-goals', JSON.stringify(goals)) }, [goals])

  const dayLogs = logs[date] || []
  const totals = useMemo(() => dayLogs.reduce((acc, item) => ({
    calories: acc.calories + item.calories,
    protein_g: acc.protein_g + item.protein_g,
    carbs_g: acc.carbs_g + item.carbs_g,
    fat_g: acc.fat_g + item.fat_g
  }), { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }), [dayLogs])
  const remaining = Math.max(0, goals.calories - totals.calories)
  const filteredFoods = sampleFoods.filter(f => f.name.toLowerCase().includes(query.toLowerCase()))
  const changeDate = offset => {
    const d = new Date(`${date}T12:00:00`)
    d.setDate(d.getDate() + offset)
    setDate(d.toLocaleDateString('sv-SE'))
  }
  const addLog = (food, type = meal) => {
    const grams = Number(food.portion_g ?? portion) || 100
    const base = Number(food.basePortion_g || food.portion_g) || 100
    const factor = grams / base
    const item = {
      id: newId(), name: food.name, meal: type, portion_g: grams,
      calories: Math.round(Number(food.calories) * factor),
      protein_g: Math.round(Number(food.protein_g) * factor * 10) / 10,
      carbs_g: Math.round(Number(food.carbs_g) * factor * 10) / 10,
      fat_g: Math.round(Number(food.fat_g) * factor * 10) / 10,
      source: food.source || 'manual'
    }
    setLogs(prev => ({ ...prev, [date]: [...(prev[date] || []), item] }))
    setModal('')
    setSelected(null); setQuery(''); setAnalysis(null); setPhoto(null); setError('')
  }
  const removeLog = id => setLogs(prev => ({ ...prev, [date]: (prev[date] || []).filter(item => item.id !== id) }))
  const lookupBarcode = async (value = barcode) => {
  const clean = String(value).replace(/[^0-9]/g, '');

  if (clean.length < 8 || clean.length > 14) {
    setScannerError(
      'Inserisci un codice a barre valido da 8 a 14 cifre.'
    );
    return;
  }

  setBarcode(clean);
  setBarcodeLoading(true);
  setScannerError('');
  setBarcodeProduct(null);

  try {
    const response = await fetch(
      `/api/lookup-barcode?code=${encodeURIComponent(clean)}`
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.error || 'Prodotto non trovato.'
      );
    }

    setBarcodeProduct(result);
  } catch (e) {
    setScannerError(
      e.message || 'Impossibile cercare il prodotto.'
    );
  } finally {
    setBarcodeLoading(false);
  }
};
  const startScanner = async () => {
    setScannerError('')
    try {
      const reader = new BrowserMultiFormatReader()
      scannerControls.current = await reader.decodeFromVideoDevice(undefined, videoRef.current, (result) => {
        if (result) {
          const code = result.getText()
          setBarcode(code)
          try { scannerControls.current?.stop() } catch {}
          scannerControls.current = null
          lookupBarcode(code)
        }
      })
    } catch {
      setScannerError('Non riesco ad aprire la fotocamera. Controlla i permessi del browser oppure inserisci il codice manualmente.')
    }
  }
  const openAdd = type => { setMeal(type); setModal('add'); setQuery(''); setSelected(null); setError('') }
  const choosePhoto = file => {
    if (!file) return
    if (!file.type.startsWith('image/')) { setError('Seleziona un file immagine.'); return }
    if (file.size > 8 * 1024 * 1024) { setError('La foto deve pesare meno di 8 MB.'); return }
    const reader = new FileReader()
    reader.onload = () => { setPhoto(reader.result); setAnalysis(null); setError('') }
    reader.readAsDataURL(file)
  }
  const analyzePhoto = async () => {
    if (!photo) return
    setAnalyzing(true); setError('')
    try {
      const response = await fetch('/api/analyze-food', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: photo })
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Analisi non disponibile.')
      setAnalysis(result)
    } catch (e) {
      setError(e.message || 'Non riesco a contattare il servizio AI. Se stai lavorando in locale, avvia l’app tramite Vercel CLI per testare l’endpoint.')
    } finally { setAnalyzing(false) }
  }
  const displayDate = date === todayKey() ? 'Oggi' : new Date(`${date}T12:00:00`).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })
  const formatLongDate = new Date(`${date}T12:00:00`).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><Leaf size={23}/></div><span>nutri<span className="brand-light">day</span></span></div>
      <div className="side-label">IL TUO SPAZIO</div>
      <button className="nav-item active"><Activity size={18}/> Riepilogo</button>
      <button className="nav-item" onClick={() => openAdd('Colazione')}><Utensils size={18}/> Diario alimentare</button>
      <button className="nav-item" onClick={() => { setEditingGoals(goals); setModal('goals') }}><Settings2 size={18}/> I tuoi obiettivi</button>
      <div className="sidebar-bottom"><div className="side-tip"><Sparkles size={18}/><b>Un passo alla volta</b><p>La costanza conta più della perfezione.</p></div><div className="privacy-note"><span className="privacy-dot"/> I tuoi dati restano su questo dispositivo</div></div>
    </aside>
    <main className="main-content">
      <header className="topbar"><div><div className="eyebrow">IL TUO DIARIO ALIMENTARE</div><h1>Buongiorno 👋</h1><p className="subheading">Prenditi cura di te, un pasto alla volta.</p></div><button className="goal-button" onClick={() => { setEditingGoals(goals); setModal('goals') }}><Settings2 size={17}/> Obiettivi</button></header>
      <div className="date-row"><div><span className="date-caption">RIEPILOGO DEL</span><h2>{formatLongDate.charAt(0).toUpperCase() + formatLongDate.slice(1)}</h2></div><div className="date-controls"><button aria-label="Giorno precedente" onClick={() => changeDate(-1)}><ChevronLeft size={19}/></button><span>{displayDate}</span><button aria-label="Giorno successivo" onClick={() => changeDate(1)}><ChevronRight size={19}/></button><button className="today-button" onClick={() => setDate(todayKey())}>Oggi</button></div></div>

      <section className="overview-grid">
        <div className="calorie-card">
          <div className="card-kicker"><span className="icon-soft orange"><Flame size={18}/></span> CALORIE DI OGGI</div>
          <div className="calorie-main"><div><strong>{fmt(totals.calories)}</strong><span> kcal assunte</span></div><div className="calorie-target">su {fmt(goals.calories)} kcal</div></div>
          <div className="progress-track calorie-track"><div style={{ width: `${Math.min(100, totals.calories / goals.calories * 100)}%` }}/></div>
          <div className="calorie-bottom"><div><span className="mini-dot green-dot"/> <b>{fmt(remaining)}</b><span> kcal rimanenti</span></div><span className="percent-label">{Math.round(totals.calories / goals.calories * 100)}% del tuo obiettivo</span></div>
          <div className="calorie-illustration"><Apple size={72} strokeWidth={1.1}/></div>
        </div>
        <div className="macro-card"><div className="macro-heading"><div><span className="date-caption">IL TUO EQUILIBRIO</span><h3>Macronutrienti</h3></div><div className="macro-symbol"><Activity size={18}/></div></div>
          <div className="macro-list">
            {[['Proteine', totals.protein_g, goals.protein, '#5e8b70', 'P'], ['Carboidrati', totals.carbs_g, goals.carbs, '#e6aa54', 'C'], ['Grassi', totals.fat_g, goals.fat, '#9b91ce', 'G']].map(([label, value, goal, color, letter]) => <div className="macro-row" key={label}><div className="macro-letter" style={{ color, background: `${color}20` }}>{letter}</div><div className="macro-detail"><div className="macro-label"><b>{label}</b><span><strong>{fmt(value)} g</strong> / {goal} g</span></div><div className="progress-track"><div style={{ width: `${Math.min(100, value / goal * 100)}%`, background: color }}/></div></div></div>)}
          </div>
        </div>
      </section>

      <section className="quick-actions"><div><h3>Aggiungi al tuo diario</h3><p>Registra quello che hai mangiato in pochi secondi.</p></div><div className="action-buttons"><button className="photo-button" onClick={() => { setModal('photo'); setPhoto(null); setAnalysis(null); setError('') }}><Camera size={18}/> Fotografa un piatto <Sparkles size={15}/></button><button className="barcode-button" onClick={() => { setModal('barcode'); setBarcode(''); setBarcodeProduct(null); setScannerError('') }}><Barcode size={18}/> Scansiona codice</button><button className="add-button" onClick={() => openAdd('Colazione')}><Plus size={18}/> Aggiungi alimento</button></div></section>

      <section className="diary-section"><div className="section-heading"><div><h3>Diario alimentare</h3><p>Quello che hai mangiato durante la giornata.</p></div><span className="entry-count">{dayLogs.length} {dayLogs.length === 1 ? 'alimento' : 'alimenti'}</span></div>
        <div className="meal-list">{mealTypes.map((type, idx) => {
          const items = dayLogs.filter(item => item.meal === type)
          const calories = items.reduce((s, item) => s + item.calories, 0)
          const Icon = [Apple, Utensils, Flame, Plus][idx]
          return <div className="meal-card" key={type}><div className="meal-header"><div className={`meal-icon meal-${idx}`}><Icon size={19}/></div><div className="meal-title"><b>{type}</b><span>{items.length ? `${items.length} ${items.length === 1 ? 'voce' : 'voci'}` : 'Ancora nessun alimento'}</span></div><div className="meal-calories">{fmt(calories)} <span>kcal</span></div><button className="meal-add" aria-label={`Aggiungi a ${type}`} onClick={() => openAdd(type)}><Plus size={19}/></button></div>
            {items.map(item => <div className="food-entry" key={item.id}><div className="food-bullet"><Check size={14}/></div><div className="food-info"><b>{item.name}</b><span>{fmt(item.portion_g)} g · P {fmt(item.protein_g)} g · C {fmt(item.carbs_g)} g · G {fmt(item.fat_g)} g</span></div><b className="food-kcal">{fmt(item.calories)} <small>kcal</small></b><button className="delete-entry" aria-label={`Elimina ${item.name}`} onClick={() => removeLog(item.id)}><Trash2 size={15}/></button></div>)}
          </div>
        })}</div>
      </section>
      <footer><span>nutriday <span className="footer-sep">·</span> Il tuo percorso, il tuo ritmo.</span><span><CircleHelp size={14}/> Le stime nutrizionali sono indicative.</span></footer>
    </main>

    {modal && <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setModal('') }}>
      <div className="modal">
        <div className="modal-head"><div><span className="eyebrow">{modal === 'photo' ? 'ANALISI INTELLIGENTE' : modal === 'barcode' ? 'RICERCA PRODOTTO' : modal === 'goals' ? 'PERSONALIZZA' : 'DIARIO ALIMENTARE'}</span><h2>{modal === 'photo' ? 'Cosa c’è nel piatto?' : modal === 'barcode' ? 'Scansiona il codice a barre' : modal === 'goals' ? 'I tuoi obiettivi' : 'Aggiungi alimento'}</h2></div><button className="close-modal" onClick={() => setModal('')}><X size={20}/></button></div>
        {modal === 'add' && <div className="modal-body">
          <label className="field-label">Pasto</label><select className="field" value={meal} onChange={e => setMeal(e.target.value)}>{mealTypes.map(m => <option key={m}>{m}</option>)}</select>
          <label className="field-label">Cerca un alimento</label><div className="search-field"><Search size={17}/><input value={query} onChange={e => { setQuery(e.target.value); setSelected(null) }} placeholder="Es. banana, pollo, riso..."/></div>
          <div className="food-search-results">{filteredFoods.map(food => <button className={`food-result ${selected?.name === food.name ? 'selected' : ''}`} key={food.name} onClick={() => { setSelected(food); setPortion(String(food.portion_g)) }}><div><b>{food.name}</b><span>{food.portion_g} g · P {food.protein_g} g · C {food.carbs_g} g · G {food.fat_g} g</span></div><strong>{food.calories} kcal</strong></button>)}{!filteredFoods.length && <p className="empty-search">Nessun alimento trovato. Puoi inserirlo manualmente qui sotto.</p>}</div>
          {selected && <div className="selected-portion"><label className="field-label">Quantità in grammi</label><input className="field" type="number" min="1" value={portion} onChange={e => setPortion(e.target.value)}/><p className="hint">I valori verranno adattati alla quantità scelta.</p><button className="primary-full" onClick={() => addLog({ ...selected, portion_g: Number(portion), basePortion_g: selected.portion_g })}><Plus size={17}/> Aggiungi al diario</button></div>}
          <details className="manual-details"><summary>Inserisci alimento manualmente</summary><div className="manual-grid"><label>Nome<input value={custom.name} onChange={e => setCustom({...custom, name:e.target.value})} placeholder="Nome alimento"/></label><label>Grammi<input type="number" value={custom.portion_g} onChange={e => setCustom({...custom, portion_g:e.target.value})}/></label><label>Calorie (kcal)<input type="number" value={custom.calories} onChange={e => setCustom({...custom, calories:e.target.value})}/></label><label>Proteine (g)<input type="number" value={custom.protein_g} onChange={e => setCustom({...custom, protein_g:e.target.value})}/></label><label>Carboidrati (g)<input type="number" value={custom.carbs_g} onChange={e => setCustom({...custom, carbs_g:e.target.value})}/></label><label>Grassi (g)<input type="number" value={custom.fat_g} onChange={e => setCustom({...custom, fat_g:e.target.value})}/></label></div><button className="primary-full" onClick={() => { if (!custom.name.trim() || ['calories','protein_g','carbs_g','fat_g','portion_g'].some(k => custom[k] === '' || Number(custom[k]) < 0) || Number(custom.portion_g) <= 0) { setError('Completa tutti i campi con valori validi.'); return } addLog({ ...custom, name: custom.name.trim(), portion_g:Number(custom.portion_g), calories:Number(custom.calories), protein_g:Number(custom.protein_g), carbs_g:Number(custom.carbs_g), fat_g:Number(custom.fat_g) }) }}><Plus size={17}/> Salva alimento</button></details>
          {error && <p className="error-message">{error}</p>}
        </div>}
        {modal === 'photo' && <div className="modal-body">
          <p className="modal-intro">Carica una foto e l’AI proverà a stimare alimento, porzione e valori nutrizionali.</p>
          {!photo ? <button className="upload-zone" onClick={() => fileRef.current?.click()}><div className="upload-icon"><ImagePlus size={27}/></div><b>Carica una foto del piatto</b><span>JPG, PNG o WEBP · massimo 8 MB</span><span className="upload-cta">Scegli immagine</span></button> : <div className="photo-preview"><img src={photo} alt="Anteprima del piatto"/><button onClick={() => { setPhoto(null); setAnalysis(null) }}><X size={16}/> Cambia foto</button></div>}
          <input ref={fileRef} type="file" accept="image/*" capture="environment" hidden onChange={e => choosePhoto(e.target.files?.[0])}/>
          {!analysis && <button className="primary-full analyze-button" disabled={!photo || analyzing} onClick={analyzePhoto}>{analyzing ? <><span className="spinner"/> Analisi in corso...</> : <><Sparkles size={17}/> Analizza con AI</>}</button>}
          {analysis && <div className="analysis-result"><div className="result-top"><div><span className="eyebrow">STIMA AI</span><h3>{analysis.name}</h3><p>Porzione stimata: {fmt(analysis.portion_g)} g</p></div><div className="result-calories"><b>{fmt(analysis.calories)}</b><span>kcal</span></div></div><div className="result-macros"><div><b>{fmt(analysis.protein_g)} g</b><span>Proteine</span></div><div><b>{fmt(analysis.carbs_g)} g</b><span>Carboidrati</span></div><div><b>{fmt(analysis.fat_g)} g</b><span>Grassi</span></div></div>{analysis.notes && <p className="hint">{analysis.notes}</p>}<label className="field-label">Aggiungi a</label><select className="field" value={meal} onChange={e => setMeal(e.target.value)}>{mealTypes.map(m => <option key={m}>{m}</option>)}</select><button className="primary-full" onClick={() => addLog({ ...analysis, source:'ai' })}><Check size={17}/> Conferma e aggiungi al diario</button><button className="secondary-full" onClick={() => setAnalysis(null)}>Riprova l’analisi</button></div>}
          {error && <p className="error-message">{error}</p>}
          <p className="disclaimer">Le foto forniscono solo una stima: peso, condimenti e ingredienti non visibili possono cambiare sensibilmente i valori. Verifica sempre i risultati.</p>
        </div>}
        {modal === 'barcode' && <div className="modal-body">
          <p className="modal-intro">Inquadra il codice a barre della confezione oppure digita il numero sotto. Cercheremo il prodotto nel database Open Food Facts.</p>
          <div className="scanner-frame"><video ref={videoRef} muted playsInline/><div className="scanner-overlay"><span/></div></div>
          <button className="secondary-full" onClick={startScanner}><Camera size={17}/> Attiva fotocamera e scansiona</button>
          <div className="barcode-entry"><label className="field-label">Codice a barre (EAN)</label><div className="barcode-input-row"><input className="field" inputMode="numeric" value={barcode} onChange={e => setBarcode(e.target.value.replace(/\D/g, '').slice(0,14))} placeholder="Es. 3017624010701"/><button className="primary-search" disabled={barcodeLoading} onClick={() => lookupBarcode()}>{barcodeLoading ? 'Cerco…' : <Search size={17}/>}</button></div></div>
          {scannerError && <p className="error-message">{scannerError}</p>}
          {barcodeProduct && <div className="barcode-product">
            <div className="barcode-product-head">{barcodeProduct.image && <img src={barcodeProduct.image} alt=""/>}<div><span className="eyebrow">PRODOTTO TROVATO</span><h3>{barcodeProduct.name}</h3>{barcodeProduct.brand && <p>{barcodeProduct.brand}</p>}{barcodeProduct.quantity && <small>Confezione: {barcodeProduct.quantity}</small>}</div></div>
            <div className="nutrition-source">Valori dichiarati per 100 g / 100 ml · Fonte: Open Food Facts</div>
            <div className="nutrition-grid">{[['Calorie',barcodeProduct.per100.calories,'kcal'],['Proteine',barcodeProduct.per100.protein_g,'g'],['Carboidrati',barcodeProduct.per100.carbs_g,'g'],['Zuccheri',barcodeProduct.per100.sugars_g,'g'],['Grassi',barcodeProduct.per100.fat_g,'g'],['Saturi',barcodeProduct.per100.saturated_fat_g,'g'],['Fibre',barcodeProduct.per100.fiber_g,'g'],['Sale',barcodeProduct.per100.salt_g,'g']].filter(([,v]) => v !== null).map(([label,value,unit]) => <div key={label}><span>{label}</span><b>{Math.round(Number(value)*10)/10} {unit}</b></div>)}</div>
            <label className="field-label">Quantità consumata in grammi / ml</label><input id="barcode-portion" className="field" type="number" min="1" defaultValue="100"/>
            <label className="field-label">Aggiungi a</label><select className="field" value={meal} onChange={e => setMeal(e.target.value)}>{mealTypes.map(m => <option key={m}>{m}</option>)}</select>
            <button className="primary-full" onClick={() => { const amount = Math.max(1, Number(document.getElementById('barcode-portion')?.value) || 100); const n = barcodeProduct.per100; addLog({ name: barcodeProduct.name, portion_g: amount, calories: n.calories, protein_g: n.protein_g, carbs_g: n.carbs_g, fat_g: n.fat_g, basePortion_g: 100, source: 'barcode' }) }}><Check size={17}/> Aggiungi al diario</button>
          </div>}
          <p className="disclaimer">La disponibilità e la completezza dei dati dipendono dal database e dalle informazioni inserite per ciascun prodotto. Controlla sempre l’etichetta della confezione.</p>
        </div>}
        {modal === 'goals' && <div className="modal-body"><p className="modal-intro">Imposta i tuoi obiettivi giornalieri. Puoi cambiarli in qualsiasi momento.</p><div className="goal-fields">{[['calories','Calorie','kcal'],['protein','Proteine','g'],['carbs','Carboidrati','g'],['fat','Grassi','g']].map(([key,label,unit]) => <label key={key}>{label}<div className="goal-input"><input type="number" min="1" value={editingGoals[key]} onChange={e => setEditingGoals({...editingGoals,[key]:Math.max(1,Number(e.target.value))})}/><span>{unit}</span></div></label>)}</div><button className="primary-full" onClick={() => { setGoals(editingGoals); setModal('') }}><Check size={17}/> Salva obiettivi</button><p className="hint">Se non sai quali obiettivi impostare, puoi parlarne con un dietista o un professionista sanitario.</p></div>}
      </div>
    </div>}
  </div>
}
createRoot(document.getElementById('root')).render(<App />)
