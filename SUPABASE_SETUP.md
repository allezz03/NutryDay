# NutriDay: attivare Google Login e Supabase

Questa versione mantiene scanner barcode, ricerca Open Food Facts, inserimento manuale e analisi foto; aggiunge Google Login, sincronizzazione del diario e calendario storico.

## 1. Crea il progetto Supabase
1. Vai su https://supabase.com e crea un progetto.
2. In **Project Settings → API** copia Project URL e la chiave **publishable** (o anon legacy). Non usare mai `service_role` nel frontend.
3. In **SQL Editor**, apri `supabase_setup.sql`, sostituisci entrambe le occorrenze di `YOUR_GOOGLE_EMAIL@example.com` con la tua email Google e premi Run.

## 2. Configura Google OAuth
1. In Google Cloud Console crea/configura un OAuth Client di tipo Web e abilita Google Identity/OAuth.
2. In Supabase apri **Authentication → Providers → Google**, abilita il provider e inserisci Client ID e Client Secret ottenuti da Google.
3. Copia l'URL di callback mostrato da Supabase (di solito `https://<project-ref>.supabase.co/auth/v1/callback`) nella sezione **Authorized redirect URIs** del client Google.
4. In **Supabase → Authentication → URL Configuration**, aggiungi il dominio Vercel (es. `https://nutry-day.vercel.app`) agli URL di redirect consentiti. Aggiungi anche `http://localhost:5173` per lo sviluppo locale.

## 3. Configura Vercel
In **Vercel → Project → Settings → Environment Variables**, aggiungi:
- `VITE_SUPABASE_URL` = Project URL Supabase
- `VITE_SUPABASE_ANON_KEY` = publishable/anon key
- `VITE_ALLOWED_EMAIL` = la tua email Google, in minuscolo
- Mantieni `OPENAI_API_KEY` già usata dall'endpoint di analisi foto.

Aggiungi le prime tre variabili anche in `.env.local` se lavori in locale. Non pubblicare `.env.local` su GitHub. Le chiavi Supabase publishable/anon sono progettate per il client, ma la sicurezza dei dati dipende dalle policy RLS incluse nello script SQL. Non inserire mai una chiave `service_role` nel frontend.

## 4. Redirect OAuth
Nel client Google, usa il callback Supabase come URI autorizzato. In Supabase, il sito Vercel e localhost devono essere URL di redirect consentiti. Dopo aver aggiunto le variabili su Vercel, fai un nuovo deploy.

## 5. Migrazione dei dati locali
Al primo login, se il database non contiene ancora giornate, l'app prova a importare i dati già presenti nel `localStorage` di quel browser e gli obiettivi locali. Non cancellare i dati del browser prima di aver verificato che l'importazione sia riuscita. Per una sicurezza maggiore, esporta o annota eventuali dati importanti prima della migrazione.

## 6. Calendario
Il calendario mensile evidenzia i giorni con alimenti registrati. Selezionando una data, la dashboard e il diario mostrano i dati di quella giornata; i dati vengono salvati nella tabella `daily_logs`.

## 7. Aggiungere utenti in futuro
Lo schema contiene `user_id` e policy RLS per isolare le righe. In questa prima configurazione, lo script SQL limita le operazioni all'email approvata. Quando vorrai aggiungere altri utenti, andranno aggiornate deliberatamente le policy di accesso (meglio tramite una tabella di utenti autorizzati gestita da amministratore) e la logica di accesso; non basta rimuovere il controllo dalla schermata.

## Test consigliato
1. Verifica Google Login sul dominio di produzione.
2. Aggiungi un alimento, ricarica la pagina e verifica che resti.
3. Seleziona un'altra data, aggiungi un pasto, poi riapri il calendario e torna alla data.
4. Prova il logout e il login.
5. Controlla in Supabase → Table Editor che le righe siano presenti.
