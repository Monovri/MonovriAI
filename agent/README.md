# Monovri AI — Lead Qualification Agent: Deployment

Dieser Ordner enthält den Backend-Code für den Chat-Agenten, der jetzt unten
rechts auf der Website erscheint. Er begrüßt Besucher, findet heraus was sie
brauchen, und drängt qualifizierte Leads Richtung Discovery-Call.

Warum ein separates Backend nötig ist: GitHub Pages liefert nur statische
Dateien aus. Der Agent muss ein KI-Modell ansprechen — das kann nicht direkt
im Browser passieren, sondern läuft über den Cloudflare Worker
(`worker.js`) dazwischen.

**Kostenlos:** Der Agent läuft komplett auf **Cloudflare Workers AI** —
kein Anthropic/OpenAI-Account, kein Zahlungsdaten-Hinterlegen nötig. Du
brauchst nur einen kostenlosen Cloudflare-Account. Das Free-Kontingent
reicht für Testbetrieb und moderaten Website-Traffic locker aus.

---

## Schritt 1 — Cloudflare Account + Worker erstellen (im Browser)

1. Geh auf https://dash.cloudflare.com und erstelle einen kostenlosen
   Account (nur E-Mail + Passwort, keine Zahlungsdaten nötig).
2. Im Menü links: **Workers & Pages** → **Create** → **Create Worker**.
3. Gib ihm den Namen `monovri-lead-agent` und klicke **Deploy** (legt erst
   ein "Hello World"-Worker an — das ist normal).
4. Klicke auf **Edit code** (öffnet den Online-Editor).
5. Lösche den kompletten Beispiel-Code und füge stattdessen den kompletten
   Inhalt von [`worker.js`](./worker.js) aus diesem Ordner ein.
6. Klicke **Save and deploy**.

## Schritt 2 — Workers AI aktivieren (die kostenlose KI)

1. Auf der Worker-Seite: **Settings → Bindings** (manchmal auch direkt
   "Variables and Bindings" genannt) → **Add** → **AI**.
2. Als Binding-Name genau `AI` eintragen (Großbuchstaben — muss exakt so
   heißen, weil der Code danach sucht).
3. Speichern. Damit darf der Worker kostenlos Cloudflares KI-Modelle
   aufrufen — kein API-Key nötig.
4. Optional, aber empfohlen sobald die Seite live läuft: unter
   **Settings → Variables and Secrets** eine normale Text-Variable
   hinzufügen:
   - Name: `ALLOWED_ORIGIN`
   - Value: `https://monovri.github.io` (oder deine eigene Domain)
   Das sorgt dafür, dass nur deine Website den Agenten benutzen kann, nicht
   irgendjemand anders, der die Worker-URL errät.
5. Oben auf der Worker-Seite siehst du die öffentliche URL, z.B.
   `https://monovri-lead-agent.DEIN-SUBDOMAIN.workers.dev`. Die brauchst du
   im nächsten Schritt.

*(Alternative für Terminal-erfahrene: `npm install -g wrangler`, dann in
diesem Ordner `wrangler login` und `wrangler deploy` — die
`[ai] binding = "AI"`-Zeile ist schon in `wrangler.toml` hinterlegt, du
musst nichts weiter konfigurieren.)*

## Schritt 3 — Widget verbinden

1. Öffne `assets/chat-widget.js`.
2. Ganz oben findest du:
   ```js
   var MV_CHAT_WORKER_URL = "";
   ```
3. Trage deine Worker-URL aus Schritt 2.5 ein:
   ```js
   var MV_CHAT_WORKER_URL = "https://monovri-lead-agent.DEIN-SUBDOMAIN.workers.dev";
   ```
4. Speichern, committen, pushen (oder mir die URL schicken, dann mach ich
   das).

## Schritt 4 — Testen

1. Öffne die Live-Seite (oder `index.html` lokal im Browser).
2. Unten rechts erscheint ein goldener Chat-Button. Klick drauf.
3. Schreib z.B. *"Wir bekommen zu viele Support-Anfragen und kommen nicht
   hinterher"* — der Agent sollte in wenigen Sekunden antworten, Rückfragen
   stellen und Richtung Discovery Call lenken.
4. Falls die Nachricht *"Der Assistent ist noch nicht verbunden"* erscheint,
   fehlt die Worker-URL (Schritt 3). Falls stattdessen ein
   "Server misconfigured"-Fehler kommt, fehlt das AI-Binding (Schritt 2).

## Anpassen

- **Verkaufston/Prompt ändern:** `SYSTEM_PROMPT` in `worker.js`.
- **Anderes (kostenloses) Modell:** Konstante `MODEL` in `worker.js` —
  volle Liste unter https://developers.cloudflare.com/workers-ai/models/
  (z.B. ein kleineres Modell für noch schnellere Antworten, oder ein
  größeres für bessere Qualität).
- **Später auf Claude upgraden:** Falls dir die Qualität von Workers AI
  irgendwann nicht mehr reicht, kann der Worker leicht auf die Claude API
  umgestellt werden (mehr Qualität, aber kostenpflichtig) — sag einfach
  Bescheid.
- **Texte/Übersetzungen des Widgets:** Objekt `I18N` in
  `assets/chat-widget.js`.

## Bekannte Grenzen (für Version 2)

- Keine Rate-Limits pro Besucher — bei sehr viel Traffic könnte jemand den
  Chat missbrauchen und das Free-Kontingent aufbrauchen. Für den Start
  (Testbetrieb bei dir) unkritisch; vor größerem Traffic würde ich
  Cloudflare Turnstile oder ein simples IP-Rate-Limit ergänzen.
- Leads werden nur im Chat gesammelt, nicht automatisch ins CRM
  weitergeleitet. Sobald der Agent bei dir läuft, ist der nächste
  sinnvolle Schritt, qualifizierte Leads automatisch per E-Mail/n8n an dich
  zu senden.
