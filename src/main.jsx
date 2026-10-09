import React, { useEffect, useMemo, useRef, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { BrowserMultiFormatReader } from '@zxing/browser'
import { createRoot } from 'react-dom/client'
import {
  Activity, Apple, ArrowDownToLine, Barcode, Camera, Check, ChevronLeft, ChevronRight,
  CircleHelp, Flame, ImagePlus, Leaf, Plus, Search, Settings2, Sparkles,
  Trash2, Utensils, X, CalendarDays, LogOut, Calendar
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
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null

function App() {
  const [session, setSession] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [authError, setAuthError] = useState('')
  useEffect(() => {
    if (!supabase) { setAuthLoading(false); return }
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setAuthLoading(false) })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession))
    return () => subscription.unsubscribe()
  }, [])
  const signIn = async () => {
    setAuthError('')
    if (!supabase) { setAuthError('Configura VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY nelle variabili d’ambiente.'); return }
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } })
    if (error) setAuthError(error.message)
  }
  if (authLoading) return <div className="auth-screen"><div className="auth-card"><div className="brand-mark auth-logo"><Leaf size={25}/></div><h1>NutriDay</h1><p>Controllo della sessione in corso…</p></div></div>
  if (!supabase) return <div className="auth-screen"><div className="auth-card"><div className="brand-mark auth-logo"><Leaf size={25}/></div><h1>NutriDay</h1><p>Per attivare login e database, configura le variabili Supabase.</p><p className="auth-help">Apri il file <code>.env.example</code> nel progetto e segui la guida SUPABASE_SETUP.md.</p></div></div>
  if (!session) return <div className="auth-screen"><div className="auth-card"><div className="brand-mark auth-logo"><Leaf size={25}/></div><div className="eyebrow">IL TUO DIARIO PERSONALE</div><h1>NutriDay</h1><p>Accedi per ritrovare il tuo diario alimentare, da qualsiasi dispositivo.</p><button className="google-login" onClick={signIn}><GoogleMark/> Continua con Google</button>{authError && <p className="error-message">{authError}</p>}<p className="auth-foot">Accesso personale protetto · Dati sincronizzati con Supabase</p></div></div>
  return <DiaryApp session={session} supabase={supabase} onSignOut={() => supabase.auth.signOut()} />
}
function GoogleMark() { return <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 3.01 13.22l7.98 6.19C12.88 13.72 18.02 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.76 7.18l7.73 6C44.42 37.9 46.98 31.7 46.98 24.55z"/><path fill="#FBBC05" d="M10.99 28.59A14.4 14.4 0 0 1 10.25 24c0-1.59.27-3.13.74-4.59l-7.98-6.19A23.9 23.9 0 0 0 .02 24c0 3.87.93 7.53 2.99 10.78l7.98-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.9-5.8l-7.73-6c-2.14 1.44-4.88 2.3-8.17 2.3-5.98 0-11.12-4.22-13.01-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg> }

function DiaryApp({ session, supabase, onSignOut }) {
  const [date, setDate] = useState(todayKey())
  const [page, setPage] = useState('dashboard')
  const [mobileDetail, setMobileDetail] = useState('')
  const [logs, setLogs] = useState({})
  const [goals, setGoals] = useState(starterGoals)
  const [dataLoading, setDataLoading] = useState(true)
  const [dataError, setDataError] = useState('')
  const [calendarMonth, setCalendarMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1))
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
  const [barcodePortion, setBarcodePortion] = useState('100')
  const [scannerActive, setScannerActive] = useState(false)
  const [scannerError, setScannerError] = useState('')

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
  useEffect(() => {
    let cancelled = false
    const loadRemoteData = async () => {
      setDataLoading(true); setDataError('')
      const userId = session.user.id
      const [{ data: rows, error: logsError }, { data: goalRow, error: goalsError }] = await Promise.all([
        supabase.from('daily_logs').select('log_date, entries').eq('user_id', userId),
        supabase.from('user_goals').select('goals').eq('user_id', userId).maybeSingle()
      ])
      if (cancelled) return
      if (logsError || goalsError) { setDataError('Non riesco a caricare il database. Verifica di aver eseguito lo script SQL SUPABASE_SETUP.md.'); setDataLoading(false); return }
      let remoteLogs = Object.fromEntries((rows || []).map(row => [row.log_date, row.entries || []]))
      const localLogs = load('nutriday-logs', {})
      if (!Object.keys(remoteLogs).length && Object.keys(localLogs).length) {
        const migrationRows = Object.entries(localLogs).filter(([, entries]) => entries?.length).map(([log_date, entries]) => ({ user_id: userId, log_date, entries }))
        if (migrationRows.length) {
          const { error } = await supabase.from('daily_logs').upsert(migrationRows, { onConflict: 'user_id,log_date' })
          if (!error) remoteLogs = localLogs
          else setDataError('Non è stato possibile importare il diario salvato in questo browser. I dati locali restano intatti.')
        }
      }
      setLogs(remoteLogs)
      const remoteGoals = goalRow?.goals
      if (remoteGoals) setGoals(remoteGoals)
      else {
        const localGoals = load('nutriday-goals', starterGoals)
        setGoals(localGoals)
        const { error } = await supabase.from('user_goals').upsert({ user_id: userId, goals: localGoals }, { onConflict: 'user_id' })
        if (error) setDataError('Diario caricato, ma non sono riuscito a salvare gli obiettivi nel database.')
      }
      setDataLoading(false)
    }
    loadRemoteData()
    return () => { cancelled = true }
  }, [session.user.id, supabase])

  const persistDay = async (day, entries) => {
    setDataError('')
    const { error } = await supabase.from('daily_logs').upsert({ user_id: session.user.id, log_date: day, entries }, { onConflict: 'user_id,log_date' })
    if (error) setDataError('Salvataggio non riuscito. Controlla la connessione e le policy Supabase.')
  }
  const persistGoals = async nextGoals => {
    setDataError('')
    const { error } = await supabase.from('user_goals').upsert({ user_id: session.user.id, goals: nextGoals }, { onConflict: 'user_id' })
    if (error) setDataError('Obiettivi aggiornati sullo schermo, ma non salvati nel database.')
  }

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
    const nextDay = [...(logs[date] || []), item]
    setLogs(prev => ({ ...prev, [date]: nextDay }))
    persistDay(date, nextDay)
    setModal('')
    setSelected(null); setQuery(''); setAnalysis(null); setPhoto(null); setError('')
  }
  const removeLog = id => { const nextDay = (logs[date] || []).filter(item => item.id !== id); setLogs(prev => ({ ...prev, [date]: nextDay })); persistDay(date, nextDay) }
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
      try { scannerControls.current?.stop() } catch {}
      scannerControls.current = null
      if (!videoRef.current) throw new Error('Fotocamera non disponibile in questa schermata.')
      const reader = new BrowserMultiFormatReader()
      scannerControls.current = await reader.decodeFromConstraints(
        { audio: false, video: { facingMode: { ideal: 'environment' } } },
        videoRef.current,
        result => {
          if (result) {
            const code = result.getText()
            setBarcode(code)
            try { scannerControls.current?.stop() } catch {}
            scannerControls.current = null
            setScannerActive(false)
            lookupBarcode(code)
          }
        }
      )
      setScannerActive(true)
    } catch (e) {
      setScannerActive(false)
      setScannerError(e?.message || 'Non riesco ad aprire la fotocamera. Controlla i permessi del browser oppure inserisci il codice manualmente.')
    }
  }
  const resetBarcodeScan = () => {
    try { scannerControls.current?.stop() } catch {}
    scannerControls.current = null
    setBarcodeProduct(null)
    setBarcode('')
    setBarcodePortion('100')
    setScannerError('')
    setScannerActive(false)
    startScanner()
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
  const accountName = (session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.user_metadata?.given_name || session.user.email?.split('@')[0] || 'utente').trim().split(/\s+/)[0]
  const formatLongDate = new Date(`${date}T12:00:00`).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })
  const monthLabel = calendarMonth.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })
  const firstWeekday = (new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1).getDay() + 6) % 7
  const daysInMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0).getDate()
  const calendarCells = [...Array(firstWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><Leaf size={23}/></div><span>nutri<span className="brand-light">day</span></span></div>
      <div className="side-label">IL TUO SPAZIO</div>
      <button className={`nav-item ${page === 'dashboard' ? 'active' : ''}`} onClick={() => setPage('dashboard')}><Activity size={18}/> Riepilogo</button>
      <button className={`nav-item ${page === 'calendar' ? 'active' : ''}`} onClick={() => setPage('calendar')}><CalendarDays size={18}/> Calendario storico</button>
      <button className="nav-item" onClick={() => openAdd('Colazione')}><Utensils size={18}/> Diario alimentare</button>
      <button className="nav-item" onClick={() => { setEditingGoals(goals); setModal('goals') }}><Settings2 size={18}/> I tuoi obiettivi</button>
      <div className="sidebar-bottom"><div className="side-tip"><Sparkles size={18}/><b>Un passo alla volta</b><p>La costanza conta più della perfezione.</p></div><div className="privacy-note"><span className="privacy-dot"/> Diario sincronizzato in modo protetto</div></div>
    </aside>
    <nav className="mobile-nav" aria-label="Navigazione principale">
      <button className={`mobile-nav-item ${page === 'dashboard' ? 'active' : ''}`} onClick={() => setPage('dashboard')}><Activity size={19}/><span>Riepilogo</span></button>
      <button className={`mobile-nav-item ${page === 'calendar' ? 'active' : ''}`} onClick={() => setPage('calendar')}><CalendarDays size={19}/><span>Calendario</span></button>
      <button className="mobile-nav-item" onClick={() => openAdd('Colazione')}><Utensils size={19}/><span>Aggiungi</span></button>
      <button className="mobile-nav-item" onClick={() => { setEditingGoals(goals); setModal('goals') }}><Settings2 size={19}/><span>Obiettivi</span></button>
    </nav>
    <main className="main-content">
      <header className="topbar"><div><div className="eyebrow">IL TUO DIARIO ALIMENTARE</div><h1>Buongiorno {accountName} 👋</h1><p className="subheading">Prenditi cura di te, un pasto alla volta.</p></div><div className="topbar-actions"><span className="user-email">{session.user.email}</span><button className="goal-button" onClick={() => { setEditingGoals(goals); setModal('goals') }}><Settings2 size={17}/> Obiettivi</button><button className="signout-button" onClick={onSignOut} title="Esci" aria-label="Esci"><LogOut size={17}/></button></div></header>
      {dataLoading && <div className="sync-notice">Caricamento del diario dal database…</div>}
      {dataError && <div className="sync-error">{dataError}</div>}
      {page === 'calendar' ? <section id="history-calendar" className="calendar-card calendar-page"><div className="calendar-heading"><div><span className="date-caption">IL TUO STORICO</span><h3>Calendario alimentare</h3><p>Seleziona un giorno per aprire la dashboard e consultare i pasti registrati.</p></div><div className="calendar-month-controls"><button onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth()-1, 1))} aria-label="Mese precedente"><ChevronLeft size={17}/></button><b>{monthLabel.charAt(0).toUpperCase()+monthLabel.slice(1)}</b><button onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth()+1, 1))} aria-label="Mese successivo"><ChevronRight size={17}/></button></div></div><div className="calendar-grid">{['Lun','Mar','Mer','Gio','Ven','Sab','Dom'].map(day => <span className="calendar-weekday" key={day}>{day}</span>)}{calendarCells.map((day, index) => { if (!day) return <span className="calendar-empty" key={'empty-'+index}/>; const key = `${calendarMonth.getFullYear()}-${String(calendarMonth.getMonth()+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`; const count = (logs[key] || []).length; return <button key={key} className={`calendar-day ${date===key?'selected':''} ${count?'has-entries':''} ${key===todayKey()?'is-today':''}`} onClick={() => { setDate(key); setPage('dashboard') }}><span>{day}</span>{count>0 && <i title={`${count} alimenti registrati`}/>}</button> })}</div><div className="calendar-legend"><span><i/> Giorni con alimenti registrati</span><button onClick={() => { setDate(todayKey()); setCalendarMonth(new Date(new Date().getFullYear(),new Date().getMonth(),1)); setPage('dashboard') }}>Torna alla dashboard di oggi</button></div></section> : <>
      <section className="mobile-quick-panel" aria-label="Riepilogo rapido">
        <div className="mobile-metric-buttons">
          <button className={`mobile-metric ${mobileDetail === 'calories' ? 'selected' : ''}`} onClick={() => setMobileDetail(mobileDetail === 'calories' ? '' : 'calories')} aria-expanded={mobileDetail === 'calories'}><span className="mobile-metric-icon calories"><Flame size={18}/></span><span><b>{fmt(totals.calories)}</b><small>kcal</small></span></button>
          <button className={`mobile-metric ${mobileDetail === 'protein' ? 'selected' : ''}`} onClick={() => setMobileDetail(mobileDetail === 'protein' ? '' : 'protein')} aria-expanded={mobileDetail === 'protein'}><span className="mobile-metric-icon protein">P</span><span><b>{fmt(totals.protein_g)} g</b><small>Proteine</small></span></button>
          <button className={`mobile-metric ${mobileDetail === 'carbs' ? 'selected' : ''}`} onClick={() => setMobileDetail(mobileDetail === 'carbs' ? '' : 'carbs')} aria-expanded={mobileDetail === 'carbs'}><span className="mobile-metric-icon carbs">C</span><span><b>{fmt(totals.carbs_g)} g</b><small>Carboidrati</small></span></button>
          <button className={`mobile-metric ${mobileDetail === 'fat' ? 'selected' : ''}`} onClick={() => setMobileDetail(mobileDetail === 'fat' ? '' : 'fat')} aria-expanded={mobileDetail === 'fat'}><span className="mobile-metric-icon fat">G</span><span><b>{fmt(totals.fat_g)} g</b><small>Grassi</small></span></button>
        </div>
        {mobileDetail && <div className="mobile-metric-detail">
          {mobileDetail === 'calories' ? <><b>Calorie</b><span>{fmt(totals.calories)} di {fmt(goals.calories)} kcal · {fmt(remaining)} kcal rimanenti</span><div className="progress-track"><div style={{width:`${Math.min(100, totals.calories / Math.max(1, goals.calories) * 100)}%`}}/></div></> : <><b>{mobileDetail === 'protein' ? 'Proteine' : mobileDetail === 'carbs' ? 'Carboidrati' : 'Grassi'}</b><span>{fmt(mobileDetail === 'protein' ? totals.protein_g : mobileDetail === 'carbs' ? totals.carbs_g : totals.fat_g)} g di {fmt(mobileDetail === 'protein' ? goals.protein : mobileDetail === 'carbs' ? goals.carbs : goals.fat)} g</span><div className="progress-track"><div style={{width:`${Math.min(100, (mobileDetail === 'protein' ? totals.protein_g / Math.max(1, goals.protein) : mobileDetail === 'carbs' ? totals.carbs_g / Math.max(1, goals.carbs) : totals.fat_g / Math.max(1, goals.fat)) * 100)}%`}}/></div></>}
        </div>}
        <button className="mobile-add-food" onClick={() => openAdd('Colazione')}><Plus size={19}/><span>Aggiungi alimento</span></button>
        <button className="mobile-scan-food" onClick={() => { setModal('barcode'); setBarcode(''); setBarcodeProduct(null); setBarcodePortion('100'); setScannerError(''); setScannerActive(false) }}><Barcode size={18}/><span>Scansiona</span></button>
      </section>
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

      <section className="quick-actions"><div><h3>Aggiungi al tuo diario</h3><p>Registra quello che hai mangiato in pochi secondi.</p></div><div className="action-buttons"><button className="barcode-button" onClick={() => { setModal('barcode'); setBarcode(''); setBarcodeProduct(null); setBarcodePortion('100'); setScannerError(''); setScannerActive(false) }}><Barcode size={18}/> Scansiona codice</button><button className="add-button" onClick={() => openAdd('Colazione')}><Plus size={18}/> Aggiungi alimento</button></div></section>

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
      </>}
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
          <div className={`scanner-frame ${scannerActive ? 'scanner-live' : ''}`}><video ref={videoRef} muted playsInline/><div className="scanner-overlay"><span/></div>{!scannerActive && !barcodeProduct && !barcodeLoading && <div className="scanner-placeholder"><Camera size={27}/><b>Inquadra il codice a barre</b><span>Usa la fotocamera posteriore del telefono</span></div>}</div>
          <button className="primary-full scanner-start" onClick={startScanner}><Camera size={17}/> {scannerActive ? 'Fotocamera attiva · inquadra il codice' : 'Apri la fotocamera e scansiona'}</button>
          {scannerActive && <button className="secondary-full" onClick={() => { try { scannerControls.current?.stop() } catch {}; scannerControls.current = null; setScannerActive(false) }}>Ferma fotocamera</button>}
          <div className="barcode-entry"><label className="field-label">Codice a barre (EAN)</label><div className="barcode-input-row"><input className="field" inputMode="numeric" value={barcode} onChange={e => setBarcode(e.target.value.replace(/\D/g, '').slice(0,14))} onKeyDown={e => { if (e.key === 'Enter') lookupBarcode(); }} placeholder="Es. 3017624010701"/><button className="primary-search" disabled={barcodeLoading} onClick={() => lookupBarcode()}>{barcodeLoading ? 'Cerco…' : <Search size={17}/>}</button></div></div>
          {scannerError && <p className="error-message">{scannerError}</p>}
          {barcodeProduct && <div className="barcode-product">
            <div className="barcode-product-head">{barcodeProduct.image && <img src={barcodeProduct.image} alt=""/>}<div><span className="eyebrow">PRODOTTO TROVATO</span><h3>{barcodeProduct.name}</h3>{barcodeProduct.brand && <p>{barcodeProduct.brand}</p>}{barcodeProduct.quantity && <small>Confezione: {barcodeProduct.quantity}</small>}</div></div>
            <div className="nutrition-source">Valori dichiarati per 100 g / 100 ml · Fonte: Open Food Facts</div>
            <div className="nutrition-grid">{[['Calorie',barcodeProduct.per100.calories,'kcal'],['Proteine',barcodeProduct.per100.protein_g,'g'],['Carboidrati',barcodeProduct.per100.carbs_g,'g'],['Zuccheri',barcodeProduct.per100.sugars_g,'g'],['Grassi',barcodeProduct.per100.fat_g,'g'],['Saturi',barcodeProduct.per100.saturated_fat_g,'g'],['Fibre',barcodeProduct.per100.fiber_g,'g'],['Sale',barcodeProduct.per100.salt_g,'g']].filter(([,v]) => v !== null).map(([label,value,unit]) => <div key={label}><span>{label}</span><b>{Math.round(Number(value)*10)/10} {unit}</b></div>)}</div>
            <label className="field-label">Quanto ne hai consumato?</label><div className="portion-shortcuts">{[30, 100, 150, 200].map(amount => <button type="button" key={amount} className={Number(barcodePortion) === amount ? 'active' : ''} onClick={() => setBarcodePortion(String(amount))}>{amount} g</button>)}</div><input id="barcode-portion" className="field" type="number" min="1" value={barcodePortion} onChange={e => setBarcodePortion(e.target.value)} inputMode="decimal"/>
            <div className="portion-preview"><span>Calorie stimate per {Math.max(1, Number(barcodePortion) || 100)} g</span><b>{fmt((Number(barcodeProduct.per100.calories) || 0) * (Math.max(1, Number(barcodePortion) || 100) / 100))} kcal</b></div>
            <label className="field-label">Aggiungi a</label><select className="field" value={meal} onChange={e => setMeal(e.target.value)}>{mealTypes.map(m => <option key={m}>{m}</option>)}</select>
            <button className="primary-full" onClick={() => { const amount = Math.max(1, Number(barcodePortion) || 100); const n = barcodeProduct.per100; addLog({ name: barcodeProduct.name, portion_g: amount, calories: n.calories, protein_g: n.protein_g, carbs_g: n.carbs_g, fat_g: n.fat_g, basePortion_g: 100, source: 'barcode' }) }}><Check size={17}/> Aggiungi al diario</button><button className="secondary-full scan-another" onClick={resetBarcodeScan}><Barcode size={17}/> Scansiona un altro prodotto</button>
          </div>}
          <p className="disclaimer">La disponibilità e la completezza dei dati dipendono dal database e dalle informazioni inserite per ciascun prodotto. Controlla sempre l’etichetta della confezione.</p>
        </div>}
        {modal === 'goals' && <div className="modal-body"><p className="modal-intro">Imposta i tuoi obiettivi giornalieri. Puoi cambiarli in qualsiasi momento.</p><div className="goal-fields">{[['calories','Calorie','kcal'],['protein','Proteine','g'],['carbs','Carboidrati','g'],['fat','Grassi','g']].map(([key,label,unit]) => <label key={key}>{label}<div className="goal-input"><input type="number" min="1" value={editingGoals[key]} onChange={e => setEditingGoals({...editingGoals,[key]:Math.max(1,Number(e.target.value))})}/><span>{unit}</span></div></label>)}</div><button className="primary-full" onClick={() => { setGoals(editingGoals); persistGoals(editingGoals); setModal('') }}><Check size={17}/> Salva obiettivi</button><p className="hint">Se non sai quali obiettivi impostare, puoi parlarne con un dietista o un professionista sanitario.</p></div>}
      </div>
    </div>}
  </div>
}
createRoot(document.getElementById('root')).render(<App />)