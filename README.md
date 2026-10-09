# NutriDay — diario personale di calorie e macronutrienti

Web app responsive in italiano, costruita con React + Vite. Include diario giornaliero, obiettivi modificabili, ricerca alimenti di esempio, inserimento manuale e analisi di una foto tramite API AI.

## Funzionalità

- Dashboard con calorie e macro giornalieri.
- Diario per colazione, pranzo, cena e spuntini.
- Navigazione tra giorni e riepilogo per pasto.
- Ricerca in un piccolo catalogo dimostrativo e inserimento manuale.
- Foto del piatto e stima AI di calorie, proteine, carboidrati e grassi.
- Scansione del codice a barre con fotocamera oppure inserimento manuale del codice.
- Ricerca del prodotto e dei valori nutrizionali tramite Open Food Facts.
- Login personale con Google tramite Supabase Auth.
- Diario e obiettivi sincronizzati nel database Supabase con Row Level Security.
- Calendario mensile per consultare il diario e la dashboard di ogni giornata.
- Importazione iniziale dei dati locali del browser, quando il database è ancora vuoto.
- Interfaccia adattiva per desktop e smartphone.

## Avvio in locale

Serve Node.js 20 o superiore.

```bash
npm install
npm run dev
```

Per testare anche l'endpoint AI in locale, installa Vercel CLI ed esegui:

```bash
npm install -g vercel
vercel dev
```

Crea una variabile d'ambiente `OPENAI_API_KEY` nel progetto Vercel o in un file `.env.local` (non caricare mai questo file su GitHub). L'endpoint `api/analyze-food.js` usa un modello con visione per produrre una **stima**, non una misurazione precisa. Il costo API dipende dall'uso e dal modello.

## Pubblicazione online con GitHub + Vercel

1. Estrai il progetto e apri la cartella.
2. Crea un repository GitHub e carica tutti i file, esclusi `node_modules` e `.env.local`.
3. Accedi a Vercel e scegli **Add New → Project**, quindi importa il repository.
4. Vercel rileva Vite. Usa `npm run build` come comando di build e `dist` come cartella di output.
5. Nelle impostazioni del progetto Vercel, aggiungi la variabile ambiente `OPENAI_API_KEY` con la tua chiave privata.
6. Fai il deploy. Le successive modifiche al branch collegato verranno pubblicate automaticamente.

**Nota:** GitHub Pages può ospitare solo la parte statica e non eseguire la funzione serverless per l'AI. Per mantenere la chiave API privata e far funzionare l'analisi delle foto, usa Vercel o un host con funzioni serverless.

## Codici a barre

La scansione usa la fotocamera del browser tramite ZXing e cerca il codice nel database Open Food Facts. La fotocamera richiede un contesto sicuro (HTTPS; in locale localhost è consentito) e il permesso dell'utente. Se il prodotto non è nel database o i dati sono incompleti, puoi inserire l'alimento manualmente. I dati di Open Food Facts sono collaborativi: verifica l'etichetta fisica.

## Login e database Supabase

Segui tutti i passaggi in `SUPABASE_SETUP.md` e personalizza `supabase_setup.sql` con la tua email Google prima di eseguirlo. Configura `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` e `VITE_ALLOWED_EMAIL` nelle variabili d’ambiente di Vercel. Non usare mai la chiave `service_role` nel frontend.

## Limiti attuali / prossimi passi

- Il catalogo alimenti iniziale è dimostrativo e non è un database nutrizionale completo.
- L'analisi fotografica è una stima visiva; condimenti, ingredienti nascosti e peso reale possono causare differenze. Controlla i valori prima di registrare.
- Per una versione multi-dispositivo si può aggiungere Supabase/Firebase con autenticazione, database e backup.
- Prima di un uso prolungato, valuta limiti di upload, gestione della privacy, controllo dei costi e protezione da abusi sull'endpoint API.

## Stack

- React 18
- Vite
- Lucide React
- Vercel Functions
- OpenAI Responses API con input immagine
