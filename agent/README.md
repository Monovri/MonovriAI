# Monovri AI — Agent Worker: Deployment

Dieser Ordner enthält den Backend-Code für alle internen Agenten, die auf
**einem** Cloudflare Worker laufen:

1. **Sales-/Lead-Qualifizierungs-Agent** — der goldene Chat-Button unten
   rechts auf der Website. Begrüßt Besucher, findet heraus was sie
   brauchen, drängt qualifizierte Leads Richtung Discovery-Call.
2. **Marketing-Content-Agent** — generiert jeden Tag automatisch Instagram-
   und LinkedIn-Post-Entwürfe und stellt sie auf einer privaten Seite
   (`content.html`) bereit, die nur du kennst.
3. **CEO-Assistent** — strategischer Sparringspartner-Chat auf einer
   privaten Seite (`ceo.html`), kennt den aktuellen Stand des Unternehmens.
4. **Content-Creator-Agent** — generiert jeden Tag automatisch einen
   Blog-Artikel-Outline sowie 2 Kurzvideo-Skripte (Reels/TikTok/Shorts) pro
   Sprache, auf einer privaten Seite (`creator.html`).
5. **Research-Agent** — Recherche-Chat für Markt-/Wettbewerbsanalysen und
   Prospect-Recherche, auf einer privaten Seite (`research.html`).
6. **Kunden-Chat-Agenten** — die Agenten, die du an zahlende Kunden
   verkaufst (automatisch eingerichtet über die Stripe-Zahlungspipeline,
   siehe unten im Code `handleStripeWebhook`).

Warum ein separates Backend nötig ist: GitHub Pages liefert nur statische
Dateien aus. Die Agenten müssen ein KI-Modell ansprechen und (bei den
Content-generierenden Agenten) Ergebnisse speichern — das läuft über den
Cloudflare Worker (`worker.js`) dazwischen.

**Kostenlos:** Alle Agenten laufen komplett auf **Cloudflare Workers AI**
— kein Anthropic/OpenAI-Account, kein Zahlungsdaten-Hinterlegen nötig. Du
brauchst nur einen kostenlosen Cloudflare-Account.

---

## Schritt 1 — Cloudflare Account + Worker erstellen (im Browser)

*(Überspring das, falls du den Worker schon für den Sales-Agenten
angelegt hast — dann geht's direkt mit Schritt 2 weiter, du musst nur den
aktualisierten Code aus `worker.js` neu einfügen.)*

1. Geh auf https://dash.cloudflare.com und erstelle einen kostenlosen
   Account (nur E-Mail + Passwort, keine Zahlungsdaten nötig).
2. Im Menü links: **Workers & Pages** (bzw. **Compute**) → **Create** →
   **Create Worker**.
3. Gib ihm den Namen `monovri-lead-agent` und klicke **Deploy**.
4. Klicke auf **Edit code** (öffnet den Online-Editor).
5. Lösche den kompletten Beispiel-Code und füge stattdessen den kompletten
   Inhalt von [`worker.js`](./worker.js) aus diesem Ordner ein.
6. Klicke **Save and deploy**.

## Schritt 2 — Workers AI aktivieren (die kostenlose KI)

*(Überspring das, falls schon erledigt.)*

1. Auf der Worker-Seite: **Settings → Bindings** → **Add binding**.
2. Typ **Workers AI** auswählen, als Variablenname genau `AI` eintragen
   (Großbuchstaben — muss exakt so heißen).
3. Speichern.

## Schritt 3 — KV-Namespace für Content-Agenten & Kundendaten anlegen

Der Marketing-Agent und der Content-Creator-Agent speichern den täglich
generierten Content zwischen (unter eigenen Keys im selben Namespace),
damit die Dashboard-Seiten ihn sofort anzeigen können, ohne jedes Mal neu
zu generieren. Derselbe Namespace speichert außerdem die Kundendatensätze
für verkaufte Agenten (Präfix `customer:`).

1. Auf der Worker-Seite: **Settings → Bindings** → **Add binding**.
2. Typ **KV Namespace** auswählen.
3. Falls noch kein Namespace existiert: **Create a KV Namespace**, Name
   z.B. `monovri-content`.
4. Als Variablenname genau `CONTENT_KV` eintragen (Großbuchstaben, exakt
   so — der Code sucht danach).
5. Speichern.

## Schritt 4 — Täglichen Cron-Trigger einrichten

Damit der Marketing-Agent und der Content-Creator-Agent jeden Morgen
automatisch neuen Content generieren, ohne dass du etwas anklicken musst:

1. Auf der Worker-Seite: Tab **Triggers** (oder **Settings → Triggers**).
2. Unter **Cron Triggers** auf **Add Cron Trigger** klicken.
3. Als Schedule eintragen: `0 6 * * *` (täglich 6:00 UTC, das ist
   7:00 bzw. 8:00 deutscher Zeit je nach Sommer-/Winterzeit).
4. Speichern.

## Schritt 5 — URLs verbinden

1. Falls noch nicht geschehen: `assets/chat-widget.js` öffnen, ganz oben
   `MV_CHAT_WORKER_URL` mit deiner Worker-URL befüllen (siehe unten für
   Widget-Details).
2. Öffne `content.html`, `ceo.html`, `creator.html` und `research.html`
   im Projekt-Root — in jeder Datei steht oben im `<script>` dieselbe
   `WORKER_URL`. Standardmäßig schon auf
   `https://monovri-lead-agent.monovri-agency.workers.dev` gesetzt, falls
   das dein Worker-Name/Subdomain ist, musst du nichts ändern.
3. Optional, empfohlen sobald alles läuft: unter **Settings → Variables
   and Secrets** eine Text-Variable `ALLOWED_ORIGIN` mit dem Wert
   `https://monovri.github.io` hinzufügen, damit nur deine Website den
   Sales-Agenten benutzen kann.

*(Alternative für Terminal-erfahrene: `npm install -g wrangler`, dann in
diesem Ordner `wrangler login`, `wrangler kv namespace create CONTENT_KV`
(die ausgegebene ID in `wrangler.toml` eintragen) und `wrangler deploy` —
AI-Binding und Cron sind schon in `wrangler.toml` hinterlegt.)*

## Schritt 6 — Testen

**Sales-Agent:** Live-Seite öffnen, unten rechts auf den goldenen
Chat-Button klicken, eine Nachricht schreiben.

**Marketing-Agent:** `content.html` im Browser öffnen (lokal oder live
unter `https://monovri.github.io/MonovriAI/content.html` — die URL ist
nicht verlinkt, du musst sie dir merken/bookmarken). Falls noch kein
Content generiert wurde, erzeugt die Seite beim ersten Laden automatisch
eine erste Charge. Mit **"🔄 Neu generieren"** kannst du jederzeit eine
neue Version anfordern, statt auf den nächsten Cron-Lauf zu warten.

**CEO-Assistent:** `ceo.html` öffnen (live unter
`https://monovri.github.io/MonovriAI/ceo.html`), Frage eintippen.

**Content-Creator-Agent:** `creator.html` öffnen (live unter
`https://monovri.github.io/MonovriAI/creator.html`) — funktioniert genau
wie das Marketing-Dashboard, nur mit Blog-Outline + Video-Skripten statt
Social-Post-Entwürfen.

**Research-Agent:** `research.html` öffnen (live unter
`https://monovri.github.io/MonovriAI/research.html`), Recherche-Frage
eintippen.

Fehlermeldungen:
- *"missing AI binding"* → Schritt 2 fehlt.
- *"missing CONTENT_KV binding"* → Schritt 3 fehlt.
- *"Der Assistent ist noch nicht verbunden"* (im Chat-Widget) → Worker-URL
  in `assets/chat-widget.js` fehlt (Schritt 5).

## Anpassen

- **Verkaufston/Prompt (Sales-Agent) ändern:** `SALES_SYSTEM_PROMPT` in
  `worker.js`.
- **Content-Stil/Themen (Marketing-Agent) ändern:** `MARKETING_SYSTEM_PROMPT`
  in `worker.js` — z.B. andere Anzahl Posts, andere Sprache, anderer Ton.
- **Ton/Kontext (CEO-Assistent) ändern:** `CEO_SYSTEM_PROMPT` in
  `worker.js`.
- **Themen/Format (Content-Creator-Agent) ändern:** `CREATOR_SYSTEM_PROMPT`
  in `worker.js` — z.B. andere Anzahl Blog-Outlines/Video-Skripte, andere
  Plattformen.
- **Fokus (Research-Agent) ändern:** `RESEARCH_SYSTEM_PROMPT` in
  `worker.js`.
- **Cron-Zeitpunkt ändern:** Im Dashboard unter Triggers, oder in
  `wrangler.toml` bei CLI-Deployment.
- **Anderes (kostenloses) Modell:** Konstante `MODEL` in `worker.js` —
  volle Liste unter https://developers.cloudflare.com/workers-ai/models/
- **Später auf Claude upgraden:** Falls dir die Qualität von Workers AI
  irgendwann nicht mehr reicht, können beide Agenten leicht auf die Claude
  API umgestellt werden (mehr Qualität, aber kostenpflichtig) — sag
  einfach Bescheid.
- **Texte/Übersetzungen des Chat-Widgets:** Objekt `I18N` in
  `assets/chat-widget.js`.

## Bekannte Grenzen (für Version 2)

- Keine Rate-Limits pro Besucher/Aufruf — bei sehr viel Traffic oder
  häufigem Klicken auf "Neu generieren" könnte jemand das Free-Kontingent
  aufbrauchen. Für den Start unkritisch; bei Bedarf lässt sich Cloudflare
  Turnstile oder ein IP-Rate-Limit ergänzen.
- `content.html` hat keinen Login-Schutz — "privat" heißt hier nur
  "nicht verlinkt/nicht indexiert". Für echten Schutz später Cloudflare
  Access oder ein einfaches Passwort ergänzen.
- Leads aus dem Sales-Agent werden nur im Chat gesammelt, nicht
  automatisch ins CRM weitergeleitet. Sinnvoller nächster Schritt:
  qualifizierte Leads automatisch per E-Mail/n8n weiterleiten.
- Generierter Marketing-Content muss noch manuell auf Instagram/LinkedIn
  gepostet werden (Copy-Paste über den "Kopieren"-Button). Echtes
  Auto-Posten würde eine Meta-/LinkedIn-App-Freigabe brauchen — deutlich
  mehr Aufwand, bei Bedarf später möglich.
