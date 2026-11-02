import { icon, ig, INTENTS, LABEL, sg, sparkle, STAR } from "../glyphs"
import { INSTALL, N2_REPLY, NOTES as NT, SSH_HOST } from "../site"
import { $, $$, box, CANCEL, center, clamp, esc, forPage, MOD, PHONE, RM, seen, STEPS } from "./dom.js"
import { cursorAt as cursorPlace, ringOff as ringClear, ringTo as ringAt, tap as tapAt } from "./marks.js"
import { flashTip, hideTip, showTip, tipHtml } from "./tip.js"

// The overlay's own intent matcher: the first and last 240 characters, whole words.
const SPAN = 240
const Q_START = /^(why|what|how|where|when|which|who|can|could|should|would|is|are|does|do|did)\b/
const KEEP = /\b(keep|love|perfect)\b|\bdon't change\b|\bdo not change\b|\bleave it\b|\bas is\b/
const FIX = /\b(broken|bug|wrong|error|fails|failing|crash|overlap|overlaps|misaligned)\b|\bdoesn't\b|\bdoes not\b|\bcan't\b|\bcannot\b|\bcut off\b/
const CHANGE = /\b(change|make|move|replace|rename|instead|bigger|smaller|larger)\b|\bshould be\b/
function guessIntent(text) {
  const t = text.trim()
  if (!t) return null
  const s = (text.length > SPAN * 2 ? `${text.slice(0, SPAN)} ${text.slice(-SPAN)}` : text).toLowerCase().replace(/’/g, "'").trim()
  if (s.endsWith("?") || Q_START.test(s)) return "question"
  if (KEEP.test(s)) return "keep"
  if (FIX.test(s)) return "fix"
  if (CHANGE.test(s)) return "change"
  return null
}
const PH = { fix: "What’s wrong with it?", change: "What should it become?", question: "What do you want to know?", keep: "What must stay exactly as it is?" }
const SPARK_TIP = "Guessed from your note. Pick a card to choose yourself."

function sheetPlace(panel) {
  const w = box($("#win"))
  panel.classList.add("bsheet")
  panel.style.width = `${w.w - 2}px`; panel.style.left = `${w.x + 1}px`; panel.style.top = `${w.y + w.h - 1 - panel.offsetHeight}px`
}

const pgv = $("#pgv")
const ovl = $("#ovl"), veil = $("#veil"), vparts = $$("#veil i"), ringEl = $("#ring"), chip = $("#chip"), cmp = $("#cmp"), pinsEl = $("#pins"), pcard = $("#pcard"), cur = $("#cur")
const ringTo = (el, r = ringEl) => ringAt(el, r)
const ringOff = (r = ringEl) => ringClear(r)
const dockEl = $("#dock"), countN = $("#countN"), sendBtn = $("#sendBtn"), sendLab = $("#sendLab"), stword = $("#stword"), sheenWord = $("#sheenWord"), counterBtn = $("#counter")
const chat = $("#chat"), pane = $("#pane"), dstat = $("[data-demo-status]"), takeBtn = $("[data-demo-takeover]")
const ta = $("#cmpText"), saveBtn = $("#saveBtn"), intentsEl = $("#intents"), resetBtn = $("#reset"), errEl = $("#cmpErr")

function setPart(el, x, y, w, h) { el.style.transform = `translate(${x}px,${y}px) scale(${Math.max(0, w)},${Math.max(0, h)})` }
function veilTo(b) {
  const s = box(pgv), p = 4
  const x0 = clamp(b.x - p - s.x, 0, s.w), y0 = clamp(b.y - p - s.y, 0, s.h), x1 = clamp(b.x + b.w + p - s.x, 0, s.w), y1 = clamp(b.y + b.h + p - s.y, 0, s.h)
  setPart(vparts[0], 0, 0, s.w, y0); setPart(vparts[1], 0, y1, s.w, s.h - y1); setPart(vparts[2], 0, y0, x0, y1 - y0); setPart(vparts[3], x1, y0, s.w - x1, y1 - y0)
  veil.classList.add("on")
}
function veilFull() { const s = box(pgv); setPart(vparts[0], 0, 0, s.w, s.h); for (const v of vparts.slice(1)) setPart(v, 0, 0, 0, 0); veil.classList.add("on") }
const veilOff = () => veil.classList.remove("on")

function info(el) {
  const compEl = el.closest("[data-comp]")
  const comp = compEl ? compEl.dataset.comp : "Page"
  let file = null, line = null, conf = "none"
  if (el.dataset.src === "none") conf = "none"
  else if (el.dataset.src) { [file, line] = el.dataset.src.split(":"); conf = el.dataset.conf || "exact" }
  else { const anc = el.parentElement && el.parentElement.closest("[data-src]"); if (anc && anc.dataset.src !== "none") { file = anc.dataset.src.split(":")[0]; conf = "file only" } }
  const first = (n) => { const c = [...n.classList].find((k) => !k.startsWith("i-") && !["on", "fixed", "band", "tint", "wash", "reveal", "in", "wrap", "tilt", "flash", "play", "past"].includes(k)); return c ? `.${c}` : "" }
  const tag = el.tagName.toLowerCase() + (el.id && !/^(mh1|msub|mbrand|mastro)$/.test(el.id) ? `#${el.id}` : first(el))
  const name = (el.getAttribute("aria-label") || (el.matches("#mh1") ? $(".v:not([aria-hidden])", el).textContent : el.textContent) || "").replace(/\s+/g, " ").trim()
  const path = []
  for (let n = el; n && n !== document.body; n = n.parentElement) { path.unshift(n.tagName.toLowerCase() + first(n)); if (n.matches("section, header, footer, main") || path.length > 3) break }
  const parent = el.parentElement && el.parentElement !== document.body ? el.parentElement.tagName.toLowerCase() + first(el.parentElement) : "body"
  return { comp, tag, name: name.length > 60 ? `${name.slice(0, 58)}…` : name, file, line, conf, path, parent }
}
const coachEl = $(".coach")
function placePanel(panel, b, gap = 14) {
  if (PHONE.matches) { sheetPlace(panel); return }
  panel.classList.remove("bsheet"); panel.style.width = ""
  const pw = panel.offsetWidth, ph = panel.offsetHeight
  let x = clamp(b.x, scrollX + 12, scrollX + innerWidth - pw - 12)
  const below = b.y + b.h + gap
  const fitsBelow = below + ph < scrollY + innerHeight - 84
  let y = fitsBelow || b.y - gap - ph < scrollY + 8 ? below : b.y - gap - ph
  const c = coachEl.getBoundingClientRect(), cx = c.left + scrollX, cy = c.top + scrollY
  if (c.width && x < cx + c.width && x + pw > cx && y < cy + c.height && y + ph > cy) {
    if (cx - pw - 12 >= scrollX + 12) x = cx - pw - 12
    else if (b.y < cy) y = cy + c.height + gap
    else if (below + ph <= scrollY + innerHeight - 40) y = below
    else y = cy + c.height + 8
  }
  panel.style.left = `${x}px`; panel.style.top = `${y}px`
}
function chipShow(el) {
  const i = info(el), b = box(el)
  chip.innerHTML = `<div class="c1"><span class="comp">${esc(i.comp)}</span><span class="in">in ${esc(i.parent)}</span><span class="dim">${Math.round(b.w)} × ${Math.round(b.h)}</span></div><div class="nm">${esc(i.tag)}${i.name ? ` · ${esc(i.name)}` : ""}</div><div class="path">${i.path.map((p, k) => (k === i.path.length - 1 ? `<strong>${esc(p)}</strong>` : `<span>${esc(p)}</span>`)).join("<i>›</i>")}</div><div class="src">${icon("file", 12)}${i.file ? `<code>${esc(i.file)}${i.line ? `:${i.line}` : ""}</code>` : "<span>no source lead</span>"}<span class="cf">${i.conf}</span></div><div class="hints"><span><kbd>↑</kbd><kbd>↓</kbd> climb</span><span><kbd>Enter</kbd> note</span><span><kbd>Esc</kbd> stop</span></div>`
  chip.classList.add("on")
  placePanel(chip, b)
}
const chipHide = () => chip.classList.remove("on")

intentsEl.innerHTML = INTENTS.map((k, n) => `<button type="button" class="intent ${k}" role="radio" aria-checked="false" aria-label="${LABEL[k]}" data-intent="${k}" tabindex="-1"><span class="spk" data-tip="${SPARK_TIP}">${sparkle()}</span>${ig(k, 24)}${LABEL[k]}<kbd>${n + 1}</kbd></button>`).join("")
const C = { el: null, intent: "fix", pick: "auto", guessed: false, scripted: false, open: false }
function setIntent(intent, guessed) {
  const changed = intent !== C.intent || guessed !== C.guessed
  C.intent = intent; C.guessed = guessed
  for (const b of $$(".intent", intentsEl)) {
    const on = b.dataset.intent === intent
    if (b.getAttribute("aria-checked") !== String(on)) { b.setAttribute("aria-checked", String(on)); b.tabIndex = on ? 0 : -1 }
    $(".spk", b).classList.toggle("on", on && guessed)
  }
  ta.placeholder = PH[intent]
  resetBtn.classList.toggle("on", C.pick === "manual")
  return changed
}
function onBody() {
  errEl.classList.remove("on")
  if (C.pick !== "auto") return
  const g = guessIntent(ta.value)
  const next = g || "fix"
  if (next !== C.intent || (g !== null) !== C.guessed) {
    setIntent(next, g !== null)
    if (g && C.scripted && !fast()) flashTip($(`.intent.${g} .spk`, intentsEl), SPARK_TIP, 1500)
  }
}
function manual(intent) { C.pick = "manual"; setIntent(intent, false) }
function openComposer(el, scripted) {
  const i = info(el), b = box(el)
  C.el = el; C.pick = "auto"; C.scripted = scripted; C.open = true; C.intent = ""; C.guessed = false
  $("#cmpComp").textContent = i.comp
  $("#cmpNm").textContent = i.tag + (i.name ? ` · ${i.name}` : "")
  $("#cmpDim").textContent = `${Math.round(b.w)} × ${Math.round(b.h)}`
  const src = $("#cmpSrc")
  src.classList.toggle("uncertain", i.conf !== "exact")
  $("#cmpFile").innerHTML = i.file ? `${esc(i.file.replace(/[^/]+$/, ""))}<b>${esc(i.file.split("/").pop())}</b>${i.line ? `:${i.line}` : ""}` : "No source lead"
  $("#cmpConf").textContent = i.conf
  ta.value = ""; errEl.classList.remove("on")
  setIntent("fix", false)
  $("#attachSw").setAttribute("aria-checked", "false"); $("#attachTw").classList.remove("on")
  cmp.classList.toggle("scripted", scripted)
  ta.classList.toggle("foc", scripted)
  cmp.classList.add("on")
  placePanel(cmp, b)
  if (!scripted) ta.focus({ preventScroll: true })
}
function closeComposer() { cmp.classList.remove("on"); C.open = false; ta.classList.remove("foc"); ta.blur() }
intentsEl.addEventListener("click", (e) => { const b = e.target.closest(".intent"); if (b && !C.scripted) manual(b.dataset.intent) })
resetBtn.addEventListener("click", () => { C.pick = "auto"; C.intent = ""; onBody(); if (!guessIntent(ta.value)) setIntent("fix", false); resetBtn.classList.remove("on") })
ta.addEventListener("input", onBody)
$("#attachSw").addEventListener("click", (e) => { const on = e.currentTarget.getAttribute("aria-checked") !== "true"; e.currentTarget.setAttribute("aria-checked", String(on)); $("#attachTw").classList.toggle("on", on) })
saveBtn.addEventListener("click", () => { if (!C.scripted) saveVisitor() })
ta.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); saveVisitor() }
  else if (e.key === "Escape") { e.preventDefault(); closeComposer(); if (picking) resumePick() }
  else if (e.altKey && /^Digit[1-4]$/.test(e.code)) { e.preventDefault(); manual(INTENTS[Number(e.code.slice(5)) - 1]) }
})

let notes = [], noteSeq = 0, roundNo = 3
function pinXY(n) {
  const b = box(n.el), k = notes.filter((m) => m.el === n.el && m.id < n.id).length * 30
  if (n.el.dataset.pin === "corner") return { x: b.x + 4 + k, y: b.y - 4 }
  if (b.x - 13 >= scrollX + 13) return { x: b.x - 13, y: b.y + 11 + k }
  if (b.x + b.w + 15 <= scrollX + innerWidth - 13) return { x: b.x + b.w + 15, y: b.y + 11 + k }
  return { x: b.x + 12 + k, y: Math.max(b.y - 12, 13) }
}
function addNote(el, intent, text, extra = {}) {
  const n = { id: ++noteSeq, el, intent, text, state: "draft", reply: null, ...extra }
  const wrap = document.createElement("div")
  wrap.className = `pp i-${intent}`
  wrap.innerHTML = `<i class="land${fast() ? "" : " go"}"></i><button type="button" class="pin ${intent} drop" aria-label="Note ${n.id}, ${LABEL[intent]}">${n.id}</button>`
  pinsEl.append(wrap)
  n.wrap = wrap; n.pin = wrap.lastChild
  const { x, y } = pinXY(n)
  wrap.style.transform = `translate(${x}px,${y}px)`
  n.pin.addEventListener("mouseenter", () => showCard(n))
  n.pin.addEventListener("mouseleave", () => { if (!cardPinned) hideCard() })
  n.pin.addEventListener("click", () => { cardPinned = pcard.dataset.n === String(n.id) && pcard.classList.contains("on") ? false : true; cardPinned ? showCard(n) : hideCard() })
  notes.push(n)
  return n
}
function placePins() {
  for (const n of notes) {
    const visible = n.el.offsetParent !== null
    n.wrap.hidden = !visible
    if (visible) { const { x, y } = pinXY(n); n.wrap.style.transform = `translate(${x}px,${y}px)` }
  }
}
function pinState(n, state) {
  n.state = state
  const p = n.pin
  p.classList.remove("drop", "hop")
  p.classList.toggle("sent", state === "sent" || state === "working")
  p.classList.toggle("working", state === "working")
  p.classList.toggle("done", state === "done")
  p.classList.toggle("answered", state === "answered")
  if (state === "done") p.innerHTML = sg("done")
  else if (state === "answered") p.innerHTML = sg("answered")
  else p.textContent = n.id
}
let cardPinned = false
function showCard(n) {
  const agent = n.reply !== null
  pcard.classList.toggle("agent", agent)
  pcard.dataset.n = n.id
  pcard.innerHTML = agent
    ? `<div class="who"><span class="av agent" style="--s:18px" role="img" aria-label="Your agent"><svg viewBox="0 0 100 100" aria-hidden="true"><use href="#agent-mark"/></svg></span><b>Your agent</b><span class="stc ${n.state === "answered" ? "q" : ""}">${sg(n.state === "done" ? "done" : "answered")}${n.state === "done" ? "done" : "answered"}</span></div><div class="tx">${n.reply}</div>${n.link ? `<a class="f" href="${n.link[0]}">${n.link[1]}${icon("right", 13)}</a>` : ""}`
    : `<div class="eb" style="color:var(--${n.intent}-t, var(--${n.intent}-d))">${ig(n.intent, 15)}${LABEL[n.intent]}</div><div class="tx">${esc(n.text)}</div>`
  pcard.classList.add("on")
  const b = box(n.wrap)
  if (PHONE.matches) { sheetPlace(pcard); return }
  pcard.classList.remove("bsheet"); pcard.style.width = ""
  if (!pgv.contains(n.el)) { placePanel(pcard, { x: b.x + 18, y: b.y - 6, w: 0, h: 12 }, 10); return }
  // below the mock page's content, so the answer never hides the fixed chip or the rewritten headline
  const m = box($(".mhero"))
  const dk = box(dockEl)
  pcard.style.left = `${clamp(b.x + 18, scrollX + 12, scrollX + innerWidth - pcard.offsetWidth - 12)}px`; pcard.style.top = `${Math.min(m.y + m.h + 10, dk.y - 8 - pcard.offsetHeight)}px`
}
function hideCard() { pcard.classList.remove("on"); cardPinned = false }

function setCount(k) {
  countN.innerHTML = `<span class="dg${fast() ? "" : " roll"}">${k}</span> ${k === 1 ? "note" : "notes"}`
  countN.classList.toggle("zero", k === 0)
  sendBtn.disabled = k === 0
  counterBtn.dataset.tip = `Round R${roundNo} · open the round sheet|R`
}
const stackEl = $("#stack")
function stackAdd(intent) {
  const k = stackEl.children.length, s = document.createElement("i")
  s.className = `i-${intent}`
  s.style.cssText = `--k:${k % 6};--r:${[-8, 5, -3, 7, -6, 4][k % 6]}deg`
  stackEl.append(s)
}
function dock(state) {
  dockEl.className = `dock s-${state}${ovl.classList.contains("away") ? " away" : ""}`
  const r = $("#dockRing"); r.className = `status-ring ring-${state}`
  const t = $("#termRing"); t.className = `status-ring ring-${state === "delivered" ? "live" : state}`
  const word = state === "busy" ? "busy" : state === "delivered" ? "delivered" : ""
  stword.hidden = !word
  stword.innerHTML = word ? `${sg(state === "busy" ? "working" : "delivered")}<span class="w">${word}</span>` : ""
  sheenWord.innerHTML = word ? `<i class="skip hs-icon"></i><span>${word}</span>` : ""
  sendLab.textContent = state === "busy" ? "Queue" : "Send"
  const sheen = $(".sheen", dockEl)
  sheen.style.animation = "none"; $(".sheen-copy", dockEl).style.animation = "none"
  void sheen.offsetWidth
  sheen.style.animation = ""; $(".sheen-copy", dockEl).style.animation = ""
}
function setTool(name) { for (const b of $$(".tools button")) b.setAttribute("aria-pressed", String(b.dataset.tool === name)) }

function tl(cls, html) { const d = document.createElement("div"); d.className = `ln ${cls}`; d.innerHTML = html; chat.append(d); chat.scrollTop = chat.scrollHeight; return d }
async function stream(cls, text, html) {
  const d = tl(cls, "")
  if (fast()) { d.innerHTML = html || esc(text); chat.scrollTop = chat.scrollHeight; return d }
  for (let i = 0; i <= text.length; i += 3) { d.textContent = text.slice(0, i); chat.scrollTop = chat.scrollHeight; await w(16) }
  d.innerHTML = html || esc(text); chat.scrollTop = chat.scrollHeight
  return d
}
async function outLines(lines, gap = 90) { let first = true; for (const l of lines) { tl(`o${first ? " first" : ""}${l.cls ? ` ${l.cls}` : ""}`, l.html || esc(l.t)); first = false; await w(gap) } }
let spin = null
function spinner(text) { spinStop(); spin = tl("s", `<span class="spark"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="${STAR}" fill="currentColor"/></svg></span>${esc(text)} <span class="mu">(esc to interrupt)</span>`) }
function spinStop() { if (spin) { spin.remove(); spin = null } }
const MARK = {
  open: '<svg class="mk" viewBox="0 0 12 12"><circle cx="6" cy="6" r="4.2" fill="none" stroke="currentColor" stroke-width="1.3"/></svg>',
  done: '<svg class="mk" viewBox="0 0 12 12" style="color:var(--toast-green)"><path d="m2.4 6.4 2.3 2.3 4.9-5.2" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  answered: '<svg class="mk" viewBox="0 0 12 12" style="color:var(--toast-blue)"><path d="M4.6 2.8 2.3 5.1l2.3 2.3M2.6 5.1h4.6a2.6 2.6 0 0 1 0 5.2H6" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
}
let paneRound = null
function renderPane() {
  let h = "<p class=\"ph\">Rounds</p><div class=\"pgrp\">"
  if (paneRound) {
    const ns = paneRound.notes, res = ns.filter((n) => n.state === "done" || n.state === "answered").length
    const tick = (n) => (["done", "answered", "working"].includes(n.state) ? n.state : "delivered")
    h += `<div class="r">${paneRound.id} · iter8-site</div><div class="rrow"><span class="tk">${ns.map((n) => `<i class="${tick(n)}"></i>`).join("")}</span><span class="mu">${paneRound.stage} · ${res} of ${ns.length}</span></div>`
    h += ns.map((n) => `<div class="nl i-${n.intent} ${n.state}"><i class="sq"></i><span>N${n.id} ${esc(n.text)}</span>${MARK[n.state === "done" ? "done" : n.state === "answered" ? "answered" : "open"]}</div>`).join("")
  } else h += '<div class="mu" style="padding-left:8px">No open rounds</div>'
  h += '</div><p class="ph">Pages</p><div class="pgrp"><div class="pgl"><span>iter8-site</span><u>iter8-site.localhost</u></div></div>'
  pane.innerHTML = h
}
function termIntro() {
  chat.innerHTML = ""
  tl("u", "open the site for review")
  tl("t", "<b>$</b> iter8 run")
  tl("o first", "iter8-site · http://iter8-site.localhost/")
  tl("c", "It’s open with the dock on it. Leave notes on the page and press Send. I’ll pick the round up here.")
}

let token = 0, hurry = false, skipping = false, mode = "auto", beat = 0, running = false, stepWake = null
const pending = new Set()
const fast = () => hurry || skipping || RM.matches
function w(ms) {
  const t = token
  return new Promise((res, rej) => {
    if (fast()) return t === token ? res() : rej(CANCEL)
    const p = { t, res, rej }
    p.id = setTimeout(() => { pending.delete(p); t === token ? res() : rej(CANCEL) }, ms)
    pending.add(p)
  })
}
function flush() { for (const p of [...pending]) { clearTimeout(p.id); pending.delete(p); p.t === token ? p.res() : p.rej(CANCEL) } }
function cancelAll() { token++; for (const p of [...pending]) { clearTimeout(p.id); p.rej(CANCEL) } pending.clear(); if (stepWake) { stepWake.rej(CANCEL); stepWake = null } }
function instant(on) { document.documentElement.classList.toggle("instant", on) }

const cursorAt = (x, y) => cursorPlace(x, y, cur)
async function cursorTo(p, ms = 650) { cur.style.transitionDuration = `${ms}ms, .2s`; cursorAt(p.x, p.y); await w(ms) }
const tap = () => tapAt(cur)
async function press(el, ms = 140) { el.classList.add("pressed"); await w(ms); el.classList.remove("pressed") }
async function typeNote(text, pace = 1) {
  if (fast()) { ta.value = text; onBody(); return }
  for (const ch of text) { ta.value += ch; onBody(); await w((ch === " " ? 55 : 30 + Math.random() * 28) * pace) }
}
function saveScripted(intent) {
  const n = addNote(C.el, C.intent || intent, ta.value.trim())
  stackAdd(n.intent)
  closeComposer()
  setCount(notes.filter((x) => x.state === "draft").length)
  return n
}
async function flyRound() {
  const slips = [...stackEl.children]
  if (fast() || !slips.length) { stackEl.innerHTML = ""; return }
  const t = chat.getBoundingClientRect(), x1 = t.left + 36, y1 = Math.min(t.bottom - 44, innerHeight - 30)
  const runs = slips.map((s, k) => {
    const r = s.getBoundingClientRect(), x0 = r.left - 5, y0 = r.top - 4, peak = Math.min(y0, y1) - 100 - k * 16
    const fly = document.createElement("div")
    fly.className = `fly ${s.className}`; fly.innerHTML = "<div><i></i></div>"
    document.body.append(fly)
    const timing = { duration: 760, delay: k * 85, fill: "both" }
    const a = fly.animate([{ transform: `translateX(${x0}px)` }, { transform: `translateX(${x1 + k * 9}px)` }], { ...timing, easing: "cubic-bezier(.45,0,.55,1)" })
    fly.firstChild.animate([{ transform: `translateY(${y0}px) rotate(-10deg)` }, { transform: `translateY(${peak}px) rotate(8deg)`, offset: 0.45 }, { transform: `translateY(${y1}px) scale(.7)`, opacity: 0.25 }], { ...timing, easing: "cubic-bezier(.3,.6,.5,1)" })
    return new Promise((res) => { const done = () => { fly.remove(); res() }; a.onfinish = done; setTimeout(done, 1500) })
  })
  stackEl.innerHTML = ""
  await Promise.all(runs)
}

const T1 = () => $("#mh1"), T2 = () => $("#msub"), T3 = () => $("#mastro"), T4 = () => $("#mbrand")
const IT = (k) => `<span class="it i-${k}">${k}</span>`
const lead = (el) => { const i = info(el); return i.file ? `${i.file}${i.line ? `:${i.line}` : ""} (${i.conf})` : "none" }
function flashEl(el, on) { el.classList.remove("flash"); if (on && !fast()) { void el.offsetWidth; el.classList.add("flash") } }
function morphH1(on) {
  const h = T1()
  h.classList.toggle("fixed", on)
  $(".v1", h).toggleAttribute("aria-hidden", on); $(".v2", h).toggleAttribute("aria-hidden", !on)
  flashEl(h, on)
}
function fixChip(on) {
  T3().classList.toggle("tilt", !on); flashEl(T3(), on)
  const n = notes.find((x) => x.el === T3())
  if (!n) return
  if (fast()) { placePins(); return }
  setTimeout(() => { n.wrap.classList.add("glide"); placePins(); setTimeout(() => n.wrap.classList.remove("glide"), 650) }, 720)
}
async function pickAndWrite(el, text, fx, fy, pace) {
  await cursorTo(center(el, fx, fy), 560); ringTo(el); veilTo(box(el)); chipShow(el); await w(600)
  tap(); chipHide(); openComposer(el, true); await w(380)
  await typeNote(text, pace); await w(480)
}
async function saveBeat(intent, gap = 650) { await press(saveBtn, 150); saveScripted(intent); await w(gap) }
const BEATS = [
  { who: "cobalt", label: "C turns on Pick", run: async () => {
    const pk = $('[data-tool="pick"]'), c = center(pk)
    cur.style.transitionDuration = "0ms"; cursorAt(c.x + 60, c.y - 70); void cur.offsetWidth
    cur.classList.add("on"); await w(250)
    await cursorTo(c, 480); tap(); await press(pk)
    setTool("pick"); showTip(pk, tipHtml(pk.dataset.tip)); veilFull()
    await w(650); hideTip()
  } },
  { who: "cobalt", label: "Hovering finds the element and its source", run: async () => {
    await cursorTo(center(T1(), 0.42, 0.62), 650); ringTo(T1()); veilTo(box(T1())); chipShow(T1()); await w(1100)
  } },
  { who: "change", label: "A click opens a note", run: async () => { tap(); chipHide(); openComposer(T1(), true); await w(500) } },
  { who: "change", label: "As the note is typed, iter8 guesses its intent", run: async () => { await typeNote(NT[1], 0.7); await w(550) } },
  { who: "change", label: `${MOD} Enter saves it as a change`, run: () => saveBeat("change", 600) },
  { who: "question", label: "A question about the line below", run: () => pickAndWrite(T2(), NT[2], 0.55, 0.45, 0.5) },
  { who: "question", label: "Saved as a question", run: () => saveBeat("question", 550) },
  { who: "fix", label: "A fix for what’s broken", run: async () => { await pickAndWrite(T3(), NT[3], 0.5, 0.5, 0.25); await saveBeat("fix", 550) } },
  { who: "keep", label: "A keep for what must stay", run: async () => { await pickAndWrite(T4(), NT[4], 0.3, 0.5, 0.25); await saveBeat("keep", 550) } },
  { who: "cobalt", label: "Send hands the round to the agent", run: async () => {
    ringOff(); veilOff(); setTool(null)
    await cursorTo(center(sendBtn), 650); tap(); await press(sendBtn, 160)
    for (const n of notes) pinState(n, "sent")
    paneRound = { id: "R3", stage: "announced", notes: notes.slice() }
    roundNo = 4; setCount(0); sendBtn.disabled = true
    dock("delivered")
    await flyRound()
    tl("h", `<span class="hk">iter8</span>Review round R3 from iter8-site · 4 notes — run <code>iter8 show R3</code>`)
    renderPane(); await w(800)
  } },
  { who: "agent", label: "The agent reads the round", run: async () => {
    cur.classList.remove("on")
    dock("busy"); for (const n of notes) pinState(n, "working")
    spinner("Reading round R3…"); await w(650); spinStop()
    tl("t", "<b>$</b> iter8 show R3")
    paneRound.stage = "claimed"; renderPane()
    const lines = [{ t: "Round R3 · iter8-site · claimed · 4 notes" }]
    for (const n of notes) lines.push({ html: `N${n.id} ${IT(n.intent)} · ${esc(n.text)}` }, { html: `<span class="mu">Source lead: ${esc(lead(n.el))}</span>` })
    await outLines(lines, 80)
    await w(400)
  } },
  { who: "agent", label: "The agent fixes the chip and edits the headline", run: async () => {
    spinner("Straightening the Astro chip…"); await w(800); spinStop()
    tl("t", "<b>edit</b> src/components/Works.astro")
    await outLines([{ t: "Updated 1 line" }, { cls: "dm", t: '6 - <Chip class="tilt">Astro</Chip>' }, { cls: "dp", t: "6 + <Chip>Astro</Chip>" }], 140)
    fixChip(true); await w(900)
    tl("t", "<b>edit</b> src/components/Hero.astro")
    await outLines([{ t: "Updated 1 line" }, { cls: "dm", t: "14 - Leave notes on your running page for your coding agent to pick up." }, { cls: "dp", t: "14 + Point at it. Say what’s wrong. Send it to your agent." }], 140)
    await w(450); morphH1(true); await w(1100)
  } },
  { who: "keep", label: "Notes close with a tick", run: async () => {
    const replies = { 1: "Cut it to three beats: point, say, send.", 3: "Took the stray tilt off. The chip sits in its row again.", 4: "Left the logo exactly as it is." }
    for (const id of [1, 3, 4]) {
      tl("t", `<b>$</b> iter8 done N${id}`); await outLines([{ t: `N${id} done` }], 60)
      const n = notes[id - 1]; n.reply = replies[id]; pinState(n, "done"); renderPane(); await w(450)
    }
    await w(300)
  } },
  { who: "question", label: "The question gets its answer on the page", run: async () => {
    tl("t", `<b>$</b> iter8 done N2 --reply "Yes. Run iter8 setup ${SSH_HOST} once…"`); await outLines([{ t: "N2 answered" }])
    notes[1].reply = N2_REPLY; notes[1].link = ["#ssh", "How the tunnel works"]
    pinState(notes[1], "answered"); renderPane()
    cardPinned = true; showCard(notes[1]); await w(2200)
  } },
  { who: "keep", label: "Round done", run: async () => {
    await stream("c", "All four notes are closed. The chip is back in its row, the headline is three beats, the logo is untouched, and the SSH answer is pinned on the page.")
    paneRound.stage = "done"; renderPane(); dock("live")
    await w(300)
  } },
]
const dashes = $("#dashes"), stpOf = $("#stpOf")
dashes.innerHTML = BEATS.map((b) => `<i class="i-${b.who}"></i>`).join("")
function setStatus(i, done) {
  const ds = dashes.children
  for (let k = 0; k < ds.length; k++) { ds[k].classList.toggle("done", done || k < i); ds[k].classList.toggle("on", !done && k === i) }
  stpOf.textContent = `${done ? BEATS.length : i + 1} of ${BEATS.length}`
  if (done) { dstat.innerHTML = `<b>Round R3 is done.</b> Replay it, step through it, or take over${matchMedia("(pointer: coarse)").matches ? "" : " and press <kbd>C</kbd>"}.`; return }
  dstat.innerHTML = `<b>${esc(BEATS[i].label)}</b>${mode === "step" ? " · press Step" : ""}`
}
function reset() {
  exitPick(); closeComposer(); chipHide(); ringOff(); veilOff(); hideCard(); hideTip(); spinStop()
  cur.classList.remove("on")
  pinsEl.innerHTML = ""; notes = []; noteSeq = 0; roundNo = 3
  morphH1(false); fixChip(false); stackEl.innerHTML = ""
  setTool(null); dock("live"); setCount(0); sendBtn.disabled = true
  paneRound = null; renderPane(); termIntro()
}
let demoSeen = false
function syncAway() { const away = !picking && !demoSeen; ovl.classList.toggle("away", away); dockEl.classList.toggle("away", away) }
new IntersectionObserver(([e]) => { demoSeen = seen(e, 0.35); document.body.classList.toggle("demo-in", demoSeen); syncAway() }, { threshold: STEPS }).observe($("#demo"))
async function whenWatchable(t) { while (!fast() && (!demoSeen || document.hidden)) { await new Promise((r) => setTimeout(r, 250)); if (t !== token) throw CANCEL } }
async function play(from) {
  const t = token
  running = true
  let slice = performance.now()
  try {
    for (beat = from; beat < BEATS.length; beat++) {
      await whenWatchable(t)
      // A skip runs every beat back to back; yielding each 30 ms keeps each task under the 50 ms budget.
      if (!fast()) slice = performance.now()
      else if (performance.now() - slice > 30) { await new Promise((r) => setTimeout(r)); if (t !== token) throw CANCEL; slice = performance.now() }
      setStatus(beat)
      instant(fast())
      await BEATS[beat].run()
      instant(false)
      if (hurry) { hurry = false }
      if (beat === BEATS.length - 1) break
      if (mode === "step" && !skipping) { setStatus(beat); await new Promise((res, rej) => { stepWake = { res, rej } }); stepWake = null }
      else await w(260)
    }
    if (t === token) { beat = BEATS.length; setStatus(0, true) }
  } catch (e) { if (e !== CANCEL) throw e } finally { instant(false); if (t === token) running = false }
}
function replay() { cancelAll(); hurry = false; skipping = false; reset(); mode = RM.matches ? "step" : "auto"; play(0) }
function step() {
  if (stepWake) { const s = stepWake; stepWake = null; s.res(); return }
  if (running) { mode = "step"; hurry = true; flush(); return }
  cancelAll(); hurry = false; reset(); mode = "step"; play(0)
}
async function skipToEnd() {
  if (!running && beat >= BEATS.length) return
  cancelAll(); reset(); skipping = true; mode = "auto"
  await play(0)
  skipping = false
}
$("[data-demo-replay]").addEventListener("click", replay)
$("[data-demo-step]").addEventListener("click", step)
$("#moreReplay").addEventListener("click", () => { closeMore(); replay() })

let picking = false, hoverEl = null, climb = []
function pickable(el) {
  if (!(el instanceof Element) || el === pgv || !pgv.contains(el) || el.closest(".veil")) return null
  return el
}
async function takeOver() {
  takeBtn.setAttribute("aria-pressed", "true")
  const cut = running
  await skipToEnd()
  enterPick(cut)
}
function enterPick(cut) {
  picking = true; syncAway(); setTool("pick"); veilFull(); takeBtn.setAttribute("aria-pressed", "true"); hideCard()
  stpOf.textContent = "Your round"
  const how = matchMedia("(pointer: coarse)").matches ? "Tap anything on the page in the browser window to leave a note." : "Point at anything on the page in the browser window, then click. <kbd>Esc</kbd> stops."
  dstat.innerHTML = `<b>Your turn.</b> ${cut ? "The demo round skipped to its end. " : ""}${how}`
}
function resumePick() { if (hoverEl) { ringTo(hoverEl); veilTo(box(hoverEl)); chipShow(hoverEl) } else veilFull() }
function exitPick() {
  picking = false; syncAway(); hoverEl = null; climb = []; setTool(null); ringOff(); veilOff(); chipHide(); takeBtn.setAttribute("aria-pressed", "false")
  if (!running) stpOf.textContent = `${Math.min(beat + 1, BEATS.length)} of ${BEATS.length}`
}
function hoverTo(el) { hoverEl = el; ringTo(el); veilTo(box(el)); chipShow(el) }
let rafPending = false, lastPt = null
document.addEventListener("pointermove", (e) => {
  if (!picking || C.open || e.pointerType === "touch") return
  lastPt = e
  if (rafPending) return
  rafPending = true
  requestAnimationFrame(() => {
    rafPending = false
    const el = pickable(document.elementFromPoint(lastPt.clientX, lastPt.clientY))
    if (el && el !== hoverEl) { climb = []; hoverTo(el) }
  })
})
document.addEventListener("click", (e) => {
  if (!picking || C.open) return
  if (e.target.closest(".dock, .ovl, .morepop, .coach .cf")) return
  const el = pickable(e.target)
  if (!el) return
  e.preventDefault(); e.stopPropagation()
  hoverTo(el); chipHide(); openComposer(el, false)
}, true)
function saveVisitor() {
  if (!C.open || C.scripted) return
  const text = ta.value.trim()
  if (!text) { errEl.classList.add("on"); cmp.classList.remove("shake"); void cmp.offsetWidth; cmp.classList.add("shake"); return }
  const n = addNote(C.el, C.intent, text, { visitor: true })
  stackAdd(n.intent)
  closeComposer()
  setCount(notes.filter((x) => x.state === "draft").length)
  if (picking) { ringOff(); veilFull(); chipHide(); hoverEl = null }
  dstat.innerHTML = `<b>Note ${n.id} saved.</b> Leave another, or press Send in the dock.`
}
const REPLY = {
  fix: (wh) => `Found it in ${wh}. On your own page I’d fix it there and close this with a tick. This page is the demo, so I’m answering instead.`,
  change: (wh) => `I’d make that change in ${wh}. This page is the demo, so it stays as it is.`,
  question: (wh) => `On your own page I’d read ${wh} and answer you right here, pinned to the element.`,
  keep: () => "Noted. I’ll leave this exactly as it is.",
}
async function visitorSend() {
  const batch = notes.filter((n) => n.state === "draft")
  if (!batch.length) return
  exitPick(); closeComposer(); hideCard()
  ++token
  const id = `R${roundNo}`
  roundNo++
  for (const n of batch) pinState(n, "sent")
  setCount(0); sendBtn.disabled = true; dock("delivered")
  const tr = $("[data-demo-term]").getBoundingClientRect()
  if (PHONE.matches) termOpen(true)
  if (tr.top < 0 || tr.bottom > innerHeight) $("[data-demo-term]").scrollIntoView({ behavior: RM.matches ? "auto" : "smooth", block: "center" })
  try {
    await w(500); await flyRound()
    tl("h", `<span class="hk">iter8</span>Review round ${id} from iter8-site · ${batch.length} ${batch.length === 1 ? "note" : "notes"} — run <code>iter8 show ${id}</code>`)
    paneRound = { id, stage: "announced", notes: batch }; renderPane()
    dstat.innerHTML = `<b>Round ${id} sent.</b> Watch the terminal.`
    await w(900); dock("busy"); for (const n of batch) pinState(n, "working")
    spinner(`Reading round ${id}…`); await w(900); spinStop()
    tl("t", `<b>$</b> iter8 show ${id}`)
    paneRound.stage = "claimed"; renderPane()
    const lines = [{ t: `Round ${id} · iter8-site · claimed · ${batch.length} ${batch.length === 1 ? "note" : "notes"}` }]
    for (const n of batch) lines.push({ html: `N${n.id} ${IT(n.intent)} · ${esc(n.text)}` }, { html: `<span class="mu">Source lead: ${esc(lead(n.el))}</span>` })
    await outLines(lines, 120)
    for (const n of batch) {
      const i = info(n.el), wh = i.file ? `<code>${esc(i.file)}${i.line ? `:${i.line}` : ""}</code>` : "the element you picked"
      n.reply = REPLY[n.intent](wh)
      const plain = n.reply.replace(/<[^>]+>/g, "")
      await w(500)
      tl("t", `<b>$</b> iter8 done N${n.id} --reply "${esc(plain.slice(0, 34))}…"`)
      await outLines([{ t: `N${n.id} ${n.intent === "keep" ? "done" : "answered"}` }])
      pinState(n, n.intent === "keep" ? "done" : "answered"); renderPane()
    }
    const outro = "That’s your round. I answered on the page instead of editing, because this is iter8’s own demo. To point me at your own page: "
    await stream("c", `${outro}${INSTALL}`, `${outro}<code>${INSTALL}</code>`)
    paneRound.stage = "done"; renderPane(); dock("live")
    dstat.innerHTML = `<b>Round ${id} is done.</b> Hover a pin to read the agent’s answer, or press <kbd>C</kbd> to go again.`
  } catch (e) { if (e !== CANCEL) throw e }
}
sendBtn.addEventListener("click", () => { if (!running) visitorSend() })
takeBtn.addEventListener("click", () => { if (picking) { exitPick(); dstat.innerHTML = "Pick stopped. Press <kbd>C</kbd> or Take over to start again." } else takeOver() })
$('[data-tool="pick"]').addEventListener("click", () => { if (picking) exitPick(); else takeOver() })
for (const t of ["point", "area"]) $(`[data-tool="${t}"]`).addEventListener("click", (e) => flashTip(e.currentTarget, "This demo covers Pick. Point and Area work the same way.", 1800))
counterBtn.addEventListener("click", () => flashTip(counterBtn, `Round R${roundNo}: ${notes.filter((n) => n.state === "draft").length} unsent`, 1600))

document.addEventListener("keydown", (e) => {
  if (!forPage(e)) return
  if (e.key === "Escape") { if (C.open) { closeComposer(); if (picking) resumePick() } else if (picking) exitPick(); closeMore(); return }
  if (e.metaKey || e.ctrlKey || e.altKey) return
  const k = e.key.toLowerCase()
  if (k === "c" && demoSeen) { e.preventDefault(); if (!picking) takeOver() }
  else if (picking && hoverEl && !C.open && (k === "arrowup" || k === "arrowdown")) {
    e.preventDefault()
    if (k === "arrowup") { const p = pickable(hoverEl.parentElement); if (p) { climb.push(hoverEl); hoverTo(p) } }
    else if (climb.length) hoverTo(climb.pop())
  } else if (picking && hoverEl && !C.open && k === "enter") { e.preventDefault(); chipHide(); openComposer(hoverEl, false) }
  else if (C.open && /^[1-4]$/.test(k)) manual(INTENTS[Number(k) - 1])
})

const morePop = $("#morePop"), moreBtn = $("#moreBtn")
function closeMore() { morePop.classList.remove("on"); moreBtn.setAttribute("aria-expanded", "false") }
moreBtn.addEventListener("click", (e) => { e.stopPropagation(); const on = !morePop.classList.contains("on"); if (on) { const r = moreBtn.getBoundingClientRect(); morePop.style.left = `${clamp(r.right - 248, 8, innerWidth - 256)}px`; morePop.style.top = `${Math.max(8, r.top - morePop.offsetHeight - 10)}px` } morePop.classList.toggle("on", on); moreBtn.setAttribute("aria-expanded", String(on)) })
document.addEventListener("click", (e) => { if (!e.target.closest("#morePop, #moreBtn")) closeMore() })

const termEl = $("[data-demo-term]"), ttog = $(".tt-tog"), tickTx = $("#tickTx")
function termOpen(on) { termEl.classList.toggle("open", on); ttog.setAttribute("aria-expanded", String(on)); ttog.textContent = on ? "Hide" : "Show" }
ttog.addEventListener("click", () => termOpen(!termEl.classList.contains("open")))
new MutationObserver(() => { const ls = $$(".ln", chat), last = ls[ls.length - 1]; if (last) tickTx.textContent = last.textContent.replace(/\s+/g, " ").trim() }).observe(chat, { childList: true, subtree: true, characterData: true })
new ResizeObserver(() => { for (const p of [chip, cmp, pcard]) if (p.classList.contains("bsheet")) sheetPlace(p) }).observe(cmp)

let rz = 0
addEventListener("resize", () => { cancelAnimationFrame(rz); rz = requestAnimationFrame(() => { placePins(); if (picking && hoverEl && !C.open) hoverTo(hoverEl); if (C.open && C.el) placePanel(cmp, box(C.el)); if (pcard.classList.contains("on")) hideCard() }) })
let roQueued = 0
new ResizeObserver(() => { cancelAnimationFrame(roQueued); roQueued = requestAnimationFrame(placePins) }).observe($("#home"))

reset()
if (RM.matches) { skipping = true; play(0).then(() => { skipping = false }) }
else if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => setTimeout(() => { if (!running && beat === 0) play(0) }, 700))
else setTimeout(() => play(0), 900)
