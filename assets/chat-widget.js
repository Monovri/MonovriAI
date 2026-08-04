/**
 * Monovri AI — Lead Qualification Chat Widget
 *
 * Talks to the Cloudflare Worker in agent/worker.js, which runs the chat
 * on Cloudflare Workers AI. Set MV_CHAT_WORKER_URL below after deploying
 * the worker (see agent/README.md) — until then the widget shows a setup
 * notice instead of silently failing.
 */
(function () {
  "use strict";

  // ── CONFIG ─────────────────────────────────────────────────────────
  var MV_CHAT_WORKER_URL = "https://monovri-lead-agent.monovri-agency.workers.dev";
  // ───────────────────────────────────────────────────────────────────

  var I18N = {
    de: {
      title: "Monovri AI Assistent",
      sub: "Antwortet meist sofort",
      placeholder: "Nachricht schreiben…",
      greeting:
        "Hi! Ich bin der KI-Assistent von Monovri AI. Erzähl mir kurz von deinem Business — ich zeige dir, wo Automatisierung dir am meisten Zeit spart.",
      notConfigured:
        "Der Assistent ist noch nicht verbunden. Bitte in agent/README.md die Deployment-Schritte ausführen und die Worker-URL in assets/chat-widget.js eintragen.",
      networkError:
        "Da ist etwas schiefgelaufen. Bitte versuch es gleich nochmal oder buch direkt einen Discovery Call.",
    },
    en: {
      title: "Monovri AI Assistant",
      sub: "Usually replies instantly",
      placeholder: "Type a message…",
      greeting:
        "Hi! I'm Monovri AI's assistant. Tell me a bit about your business — I'll show you where automation saves you the most time.",
      notConfigured:
        "The assistant isn't connected yet. Follow the deployment steps in agent/README.md and paste your Worker URL into assets/chat-widget.js.",
      networkError:
        "Something went wrong. Please try again in a moment, or book a Discovery Call directly.",
    },
  };

  function lang() {
    var l = (typeof localStorage !== "undefined" && localStorage.getItem("ml")) || "en";
    return I18N[l] ? l : "en";
  }

  function t(key) {
    return I18N[lang()][key];
  }

  var history = [];
  var greeted = false;

  function svgIcon(path) {
    return (
      '<svg viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
      path +
      "</svg>"
    );
  }

  function buildDom() {
    var btn = document.createElement("button");
    btn.id = "mv-chat-btn";
    btn.setAttribute("aria-label", "Chat");
    btn.innerHTML =
      '<span class="mv-chat-open-ico">' +
      svgIcon(
        '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" stroke="#000"/>'
      ) +
      "</span>" +
      '<span class="mv-chat-close-ico">' +
      svgIcon('<path d="M18 6 6 18M6 6l12 12"/>') +
      "</span>";

    var panel = document.createElement("div");
    panel.id = "mv-chat-panel";
    panel.innerHTML =
      '<div class="mv-chat-head">' +
      '<span class="mv-chat-dot"></span>' +
      '<div><div class="mv-chat-title" id="mv-chat-title"></div>' +
      '<div class="mv-chat-sub" id="mv-chat-sub"></div></div>' +
      "</div>" +
      '<div class="mv-chat-body" id="mv-chat-body"></div>' +
      '<div class="mv-chat-foot">' +
      '<textarea class="mv-chat-input" id="mv-chat-input" rows="1"></textarea>' +
      '<button class="mv-chat-send" id="mv-chat-send" aria-label="Send">' +
      svgIcon('<path d="m22 2-7 20-4-9-9-4 20-7z"/><path d="M22 2 11 13"/>') +
      "</button>" +
      "</div>";

    document.body.appendChild(btn);
    document.body.appendChild(panel);
    return { btn: btn, panel: panel };
  }

  function addMessage(body, role, text) {
    var el = document.createElement("div");
    el.className = "mv-msg " + role;
    el.textContent = text;
    body.appendChild(el);
    body.scrollTop = body.scrollHeight;
    return el;
  }

  function addTyping(body) {
    var el = document.createElement("div");
    el.className = "mv-typing";
    el.innerHTML = "<span></span><span></span><span></span>";
    body.appendChild(el);
    body.scrollTop = body.scrollHeight;
    return el;
  }

  async function sendMessage(body, input, sendBtn, text) {
    addMessage(body, "user", text);
    history.push({ role: "user", content: text });
    input.value = "";
    input.style.height = "auto";
    sendBtn.disabled = true;

    var typingEl = addTyping(body);

    if (!MV_CHAT_WORKER_URL) {
      typingEl.remove();
      addMessage(body, "err", t("notConfigured"));
      sendBtn.disabled = false;
      return;
    }

    try {
      var res = await fetch(MV_CHAT_WORKER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });
      var data = await res.json();
      typingEl.remove();

      if (!res.ok || !data.reply) {
        addMessage(body, "err", t("networkError"));
      } else {
        addMessage(body, "bot", data.reply);
        history.push({ role: "assistant", content: data.reply });
      }
    } catch (e) {
      typingEl.remove();
      addMessage(body, "err", t("networkError"));
    } finally {
      sendBtn.disabled = false;
      input.focus();
    }
  }

  function init() {
    var dom = buildDom();
    var body = dom.panel.querySelector("#mv-chat-body");
    var input = dom.panel.querySelector("#mv-chat-input");
    var sendBtn = dom.panel.querySelector("#mv-chat-send");

    function applyTexts() {
      dom.panel.querySelector("#mv-chat-title").textContent = t("title");
      dom.panel.querySelector("#mv-chat-sub").textContent = t("sub");
      input.placeholder = t("placeholder");
    }
    applyTexts();

    dom.btn.addEventListener("click", function () {
      var isOpen = dom.panel.classList.toggle("open");
      dom.btn.classList.toggle("open", isOpen);
      if (isOpen) {
        applyTexts();
        if (!greeted) {
          addMessage(body, "bot", t("greeting"));
          greeted = true;
        }
        input.focus();
      }
    });

    function submit() {
      var text = input.value.trim();
      if (!text) return;
      sendMessage(body, input, sendBtn, text);
    }

    sendBtn.addEventListener("click", submit);
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        submit();
      }
    });
    input.addEventListener("input", function () {
      input.style.height = "auto";
      input.style.height = Math.min(input.scrollHeight, 80) + "px";
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
