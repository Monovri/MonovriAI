# Monovri AI — Lead Qualification Agent: Deployment

Dieser Ordner enthält den Backend-Code für den Chat-Agenten, der jetzt unten
rechts auf der Website erscheint. Er begrüßt Besucher, findet heraus was sie
brauchen, und drängt qualifizierte Leads Richtung Discovery-Call.

Warum ein separates Backend nötig ist: GitHub Pages liefert nur statische
Dateien aus. Der Claude-API-Key darf aber niemals im Browser-Code (also in
`assets/chat-widget.js`) stehen, sonst kann ihn jeder Website-Besucher
auslesen und auf deine Kosten nutzen. Der Cloudflare Worker (`worker.js`)
läuft dazwischen: der Browser redet nur mit dem Worker, der Worker redet mit
Claude und hält den Key geheim.

Kosten: Cloudflare Workers sind bis 100.000 Requests/Tag kostenlos. Claude
Haiku (das hier verwendete Modell) kostet nur Bruchteile eines Cents pro
Konversation.

---

## Schritt 1 — Anthropic API-Key erstellen

1. Geh auf https://console.anthropic.com und registriere dich (oder logge
   dich ein).
2. Links im Menü auf **API Keys** → **Create Key**. Gib ihm einen Namen wie
   `monovri-website`.
3. Kopiere den Key sofort (er beginnt mit `sk-ant-...`) — er wird nur einmal
   angezeigt.
4. Geh zu **Settings → Billing** und hinterlege eine Zahlungsmethode / lade
   ein kleines Guthaben auf (ein paar Euro reichen für den Start). Ohne
   Guthaben lehnt die API jede Anfrage ab.

## Schritt 2 — Cloudflare Worker deployen (im Browser, kein Terminal nötig)

1. Geh auf https://dash.cloudflare.com und erstelle einen kostenlosen
   Account.
2. Im Menü links: **Workers & Pages** → **Create** → **Create Worker**.
3. Gib ihm den Namen `monovri-lead-agent` und klicke **Deploy** (legt erst
   ein "Hello World"-Worker an — das ist normal).
4. Klicke auf **Edit code** (öffnet den Online-Editor).
5. Lösche den kompletten Beispiel-Code und füge stattdessen den kompletten
   Inhalt von [`worker.js`](./worker.js) aus diesem Ordner ein.
6. Klicke **Save and deploy**.
7. Zurück auf der Worker-Übersichtsseite: **Settings → Variables and
   Secrets** → **Add** →
   - Type: `Secret`
   - Name: `ANTHROPIC_API_KEY`
   - Value: dein Key aus Schritt 1
   - Speichern (der Worker startet automatisch neu).
8. Optional, aber empfohlen sobald die Seite live läuft: füge noch eine
   normale Variable hinzu:
   - Type: `Text`
   - Name: `ALLOWED_ORIGIN`
   - Value: `https://monovri.github.io` (oder deine eigene Domain, falls du
     eine einrichtest)
   Das sorgt dafür, dass nur deine Website den Agenten benutzen kann, nicht
   irgendjemand anders, der die Worker-URL errät.
9. Oben auf der Worker-Seite siehst du die öffentliche URL, z.B.
   `https://monovri-lead-agent.DEIN-SUBDOMAIN.workers.dev`. Die brauchst du
   im nächsten Schritt.

*(Alternative für Terminal-erfahrene: `npm install -g wrangler`, dann in
diesem Ordner `wrangler login`, `wrangler secret put ANTHROPIC_API_KEY` und
`wrangler deploy` — nutzt automatisch die `wrangler.toml` hier.)*

## Schritt 3 — Widget verbinden

1. Öffne `assets/chat-widget.js`.
2. Ganz oben findest du:
   ```js
   var MV_CHAT_WORKER_URL = "";
   ```
3. Trage deine Worker-URL aus Schritt 2.9 ein:
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
   fehlt entweder die Worker-URL (Schritt 3) oder der Secret-Key im Worker
   (Schritt 2.7).

## Anpassen

- **Verkaufston/Prompt ändern:** `SYSTEM_PROMPT` in `worker.js`.
- **Anderes Modell** (z.B. für höhere Qualität statt niedrigere Kosten):
  Konstante `MODEL` in `worker.js`, z.B. auf `claude-sonnet-5` ändern.
- **Texte/Übersetzungen des Widgets:** Objekt `I18N` in
  `assets/chat-widget.js`.

## Bekannte Grenzen (für Version 2)

- Keine Rate-Limits pro Besucher — bei sehr viel Traffic könnte jemand den
  Chat missbrauchen und Kosten verursachen. Für den Start (Testbetrieb bei
  dir) unkritisch; vor größerem Traffic würde ich Cloudflare Turnstile oder
  ein simples IP-Rate-Limit ergänzen.
- Leads werden nur im Chat gesammelt, nicht automatisch ins CRM
  weitergeleitet. Sobald der Agent bei dir läuft, ist der nächste
  sinnvolle Schritt, qualifizierte Leads automatisch per E-Mail/n8n an dich
  zu senden.
