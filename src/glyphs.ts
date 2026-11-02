type IconDef = { vb: number; k: "fill" | "stroke"; sw?: number; er?: number; d: string[] }
const ICON: Record<string, IconDef> = {
  pick: { vb: 16, k: "stroke", d: ["M3 3l4.2 10.2 1.6-4.4 4.4-1.6z", "M9.2 9.2 13 13"] },
  point: { vb: 20, k: "stroke", sw: 1.6, d: ["M10 18s5.5-4.9 5.5-9.2a5.5 5.5 0 0 0-11 0C4.5 13.1 10 18 10 18z", "M12 8.8a2 2 0 1 1-4 0 2 2 0 0 1 4 0z"] },
  area: { vb: 16, k: "fill", d: ["M3.5 11a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3m9 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3m-3 1a.5.5 0 0 1 0 1h-3a.5.5 0 0 1 0-1zm-6-6c.28 0 .5.22.5.5v3a.5.5 0 0 1-1 0v-3c0-.28.22-.5.5-.5m9 0c.28 0 .5.22.5.5v3a.5.5 0 0 1-1 0v-3c0-.28.22-.5.5-.5m-9-4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3m9 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3m-3 1a.5.5 0 0 1 0 1h-3a.5.5 0 0 1 0-1z"] },
  send: { vb: 24, k: "fill", er: 1, d: ["M17.991 6.01 5.399 10.563l4.195 2.428 3.699-3.7a1 1 0 0 1 1.414 1.415l-3.7 3.7 2.43 4.194L17.99 6.01Zm.323-2.244c1.195-.433 2.353.725 1.92 1.92l-5.282 14.605c-.434 1.198-2.07 1.344-2.709.241l-3.217-5.558-5.558-3.217c-1.103-.639-.957-2.275.241-2.709z"] },
  x: { vb: 24, k: "fill", er: 1, d: ["m12 13.414 5.657 5.657a1 1 0 0 0 1.414-1.414L13.414 12l5.657-5.657a1 1 0 0 0-1.414-1.414L12 10.586 6.343 4.929A1 1 0 0 0 4.93 6.343L10.586 12l-5.657 5.657a1 1 0 1 0 1.414 1.414z"] },
  edit: { vb: 24, k: "fill", d: ["M16.035 3.015a3 3 0 0 1 4.099-.135l.144.135.707.707a3 3 0 0 1 .135 4.098l-.135.144L9.773 19.177a1.5 1.5 0 0 1-.562.354l-.162.047-4.454 1.028a1.001 1.001 0 0 1-1.22-1.088l.02-.113 1.027-4.455a1.5 1.5 0 0 1 .29-.598l.111-.125zm-.707 3.535-8.99 8.99-.636 2.758 2.758-.637 8.99-8.99-2.122-2.12Zm3.536-2.121a1 1 0 0 0-1.32-.083l-.094.083-.708.707 2.122 2.121.707-.707a1 1 0 0 0 .083-1.32l-.083-.094z"] },
  check: { vb: 24, k: "fill", er: 1, d: ["M21.192 5.465a1 1 0 0 1 0 1.414L9.95 18.122a1.1 1.1 0 0 1-1.556 0l-5.586-5.586a1 1 0 1 1 1.415-1.415l4.95 4.95L19.777 5.465a1 1 0 0 1 1.414 0Z"] },
  file: { vb: 24, k: "fill", d: ["M13.586 2a2 2 0 0 1 1.284.467l.13.119L19.414 7a2 2 0 0 1 .578 1.238l.008.176V20a2 2 0 0 1-1.85 1.995L18 22H6a2 2 0 0 1-1.995-1.85L4 20V4a2 2 0 0 1 1.85-1.995L6 2zM12 4H6v16h12V10h-4.5A1.5 1.5 0 0 1 12 8.5zm2 .414V8h3.586z"] },
  history: { vb: 24, k: "fill", d: ["M20.66 7c2.762 4.783 1.123 10.9-3.66 13.66-4.123 2.38-9.233 1.491-12.335-1.86a1 1 0 0 1 1.468-1.358 8 8 0 1 0-2.06-6.524l1.281-.335c1.047-.273 1.818.97 1.108 1.787L4.21 14.957c-.568.652-1.665.43-1.892-.444A10.003 10.003 0 0 1 7 3.34C11.783.579 17.899 2.217 20.66 7M12 6a1 1 0 0 1 1 1v4.586l2.707 2.707a1 1 0 1 1-1.414 1.414l-3-3A1 1 0 0 1 11 12V7a1 1 0 0 1 1-1"] },
  more: { vb: 24, k: "fill", d: ["M6 10.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3m6 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3m6 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3"] },
  copy: { vb: 24, k: "fill", d: ["M9 2a2 2 0 0 0-2 2v2h2V4h11v11h-2v2h2a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2zM4 7a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2zm0 2h11v11H4z"] },
  right: { vb: 24, k: "fill", d: ["M15.707 11.293a1 1 0 0 1 0 1.414l-5.657 5.657a1 1 0 1 1-1.414-1.414l4.95-4.95-4.95-4.95a1 1 0 0 1 1.414-1.414l5.657 5.657Z"] },
  lock: { vb: 24, k: "fill", d: ["M12 2a6 6 0 0 1 5.996 5.775L18 8h1a2 2 0 0 1 1.995 1.85L21 10v10a2 2 0 0 1-1.85 1.995L19 22H5a2 2 0 0 1-1.995-1.85L3 20V10a2 2 0 0 1 1.85-1.995L5 8h1a6 6 0 0 1 6-6m7 8H5v10h14zm-7 2a2 2 0 0 1 1.134 3.647l-.134.085V17a1 1 0 0 1-1.993.117L11 17v-1.268A2 2 0 0 1 12 12m0-8a4 4 0 0 0-4 4h8a4 4 0 0 0-4-4"] },
  undo: { vb: 24, k: "fill", er: 1, d: ["M3.076 5.617A1 1 0 0 1 4 5h10a7 7 0 1 1 0 14H5a1 1 0 1 1 0-2h9a5 5 0 1 0 0-10H6.414l1.793 1.793a1 1 0 0 1-1.414 1.414l-3.5-3.5a1 1 0 0 1-.217-1.09Z"] },
  sun: { vb: 24, k: "fill", d: ["M12 19a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0v-1a1 1 0 0 1 1-1m6.364-2.05.707.707a1 1 0 0 1-1.414 1.414l-.707-.707a1 1 0 0 1 1.414-1.414m-12.728 0a1 1 0 0 1 1.497 1.32l-.083.094-.707.707a1 1 0 0 1-1.497-1.32l.083-.094zM12 6a6 6 0 1 1 0 12 6 6 0 0 1 0-12m0 2a4 4 0 1 0 0 8 4 4 0 0 0 0-8m-8 3a1 1 0 0 1 .117 1.993L4 13H3a1 1 0 0 1-.117-1.993L3 11zm17 0a1 1 0 1 1 0 2h-1a1 1 0 1 1 0-2zM4.929 4.929a1 1 0 0 1 1.32-.083l.094.083.707.707a1 1 0 0 1-1.32 1.497l-.094-.083-.707-.707a1 1 0 0 1 0-1.414m14.142 0a1 1 0 0 1 0 1.414l-.707.707a1 1 0 1 1-1.414-1.414l.707-.707a1 1 0 0 1 1.414 0M12 2a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0V3a1 1 0 0 1 1-1"] },
  moon: { vb: 24, k: "fill", er: 1, d: ["M13.574 3.137a1.01 1.01 0 0 0-1.097 1.409 6 6 0 0 1-7.931 7.931 1.01 1.01 0 0 0-1.409 1.097A9 9 0 0 0 21 12c0-4.434-3.206-8.118-7.426-8.863m1.307 2.481A7.002 7.002 0 0 1 12 19a7.002 7.002 0 0 1-6.382-4.12 8 8 0 0 0 9.263-9.263Z"] },
  info: { vb: 24, k: "fill", d: ["M12 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2m0 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16m-.01 6c.558 0 1.01.452 1.01 1.01v5.124A1 1 0 0 1 12.5 18h-.49A1.01 1.01 0 0 1 11 16.99V12a1 1 0 1 1 0-2zM12 7a1 1 0 1 1 0 2 1 1 0 0 1 0-2"] },
  alert: { vb: 24, k: "fill", d: ["m13.299 3.148 8.634 14.954a1.5 1.5 0 0 1-1.299 2.25H3.366a1.5 1.5 0 0 1-1.299-2.25l8.634-14.954c.577-1 2.02-1 2.598 0M12 4.898 4.232 18.352h15.536zM12 15a1 1 0 1 1 0 2 1 1 0 0 1 0-2m0-7a1 1 0 0 1 1 1v4a1 1 0 1 1-2 0V9a1 1 0 0 1 1-1"] },
}
export function icon(name: string, size = 16, cls = "") {
  const i = ICON[name]
  if (!i) throw new Error(`no icon ${name}`)
  const ink = i.k === "fill" ? 'fill="currentColor"' : `fill="none" stroke="currentColor" stroke-width="${i.sw || 1.5}" stroke-linecap="round" stroke-linejoin="round"`
  const paths = i.d.map((d) => `<path d="${d}"${i.er ? ' fill-rule="evenodd"' : ""}/>`).join("")
  return `<svg class="ic ic-${i.k}${cls ? ` ${cls}` : ""}" width="${size}" height="${size}" viewBox="0 0 ${i.vb} ${i.vb}" aria-hidden="true"><g class="ic-d" transform="translate(0 ${(i.vb / size).toFixed(3)})" ${ink}>${paths}</g><g ${ink}>${paths}</g></svg>`
}

export type Intent = "fix" | "change" | "question" | "keep"
const IG: Record<Intent, { shape: string; detail: string; face?: string }> = {
  fix: { shape: '<rect x="1.5" y="6.5" width="17" height="7" rx="3.5" transform="rotate(-40 10 10)"/>', detail: '<g transform="rotate(-40 10 10)"><rect class="hi" x="7.2" y="6.5" width="5.6" height="7"/><circle class="hi" cx="4.2" cy="10" r=".9"/><circle class="hi" cx="15.8" cy="10" r=".9"/></g>' },
  change: { shape: '<path transform="rotate(-45 10 10)" d="M2.4 7.5H14l5 2.5-5 2.5H2.4a1.4 1.4 0 0 1-1.4-1.4V8.9a1.4 1.4 0 0 1 1.4-1.4z"/>', detail: '<g transform="rotate(-45 10 10)"><path d="M14 7.5l5 2.5-5 2.5z" fill="#F7E4C2"/><path d="M17.3 8.85 19 10l-1.7 1.15z" class="gd"/><rect class="hi" x="3.6" y="7.5" width="1.5" height="5"/></g>' },
  question: { shape: '<path d="M4.5 2.5h11a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3H9.2l-3.7 3.3v-3.3h-1a3 3 0 0 1-3-3v-6a3 3 0 0 1 3-3z"/>', detail: '<path class="ln" d="M7.9 6.7a2.15 2.15 0 1 1 2.9 2c-.5.25-.8.6-.8 1.15v.25"/><circle cx="10" cy="12.15" r="1.05" fill="#fff"/>' },
  keep: { shape: '<rect x="2" y="3.5" width="16" height="4.2" rx="2.1"/><circle cx="3.7" cy="13.4" r="1.75"/><circle cx="7.9" cy="13.4" r="1.75"/><circle cx="12.1" cy="13.4" r="1.75"/><circle cx="16.3" cy="13.4" r="1.75"/>', face: '<rect x="2" y="3.5" width="16" height="4.2" rx="2.1"/><circle class="dt" cx="3.7" cy="13.4" r="1.75"/><circle class="dt" cx="7.9" cy="13.4" r="1.75"/><circle class="dt" cx="12.1" cy="13.4" r="1.75"/><circle class="dt" cx="16.3" cy="13.4" r="1.75"/>', detail: '<rect class="hi" x="4" y="4.4" width="7" height="1.1" rx=".55"/>' },
}
export function ig(intent: Intent, size = 20) {
  const g = IG[intent]
  return `<svg class="gl g-${intent}" width="${size}" height="${size}" viewBox="0 0 20 20" style="--c:var(--${intent});--cd:var(--${intent}-d)" aria-hidden="true"><g class="mv"><g class="gd" transform="translate(0 1.7)">${g.shape}</g><g class="gf">${g.face || g.shape}</g>${g.detail}</g></svg>`
}
export const STAR = "M10 1.4c.6 4.7 3.3 7.4 8 8.1.55.08.55.82 0 .9-4.7.7-7.4 3.4-8 8.1-.08.55-.82.55-.9 0-.65-4.7-3.35-7.4-8-8.1-.55-.08-.55-.82 0-.9 4.65-.7 7.35-3.4 8-8.1.08-.55.82-.55.9 0z"
export const sparkle = () => `<svg class="gl" viewBox="0 0 20 20" aria-hidden="true"><g class="mv"><path class="gd" transform="translate(0 1.7)" d="${STAR}"/><path class="gf" d="${STAR}"/><path class="hi" d="M9.1 5.3c-.35 1.6-1 2.7-2 3.4 1.2-.05 2.05-.7 2.4-1.8z"/></g></svg>`
let clipN = 0
export type Stage = "queued" | "delivered" | "working" | "done" | "answered"
const SG: Record<Stage, (clip: string) => string> = {
  queued: () => '<path class="d" transform="translate(0 1)" d="M2.5 10.5v3.8a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-3.8h-3.6a2.4 2.4 0 0 1-4.8 0z"/><path class="f" d="M2.5 10.5v3.8a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-3.8h-3.6a2.4 2.4 0 0 1-4.8 0z"/><g class="slip"><rect class="paper" x="5.5" y="2" width="7" height="6.2" rx="1"/><rect class="f" x="5.5" y="2" width="7" height="6.2" rx="1"/><path class="f" d="M7.3 4.3h3.4M7.3 6.1h2"/></g>',
  delivered: (id) => `<defs><clipPath id="${id}"><rect x="-2" y="-12" width="22" height="24.2"/></clipPath></defs><rect class="d" transform="translate(0 1)" x="2" y="10" width="14" height="5.5" rx="1.6"/><g clip-path="url(#${id})"><g class="note"><rect class="paper" x="5.8" y="2.6" width="6.4" height="9.4" rx=".8"/><rect class="f" x="5.8" y="2.6" width="6.4" height="9.4" rx=".8"/><path class="f" d="M5.9 3.2 9 5.6l3.1-2.4"/></g></g><rect class="paper" x="2" y="10" width="14" height="5.5" rx="1.6"/><rect class="f" x="2" y="10" width="14" height="5.5" rx="1.6"/><path class="f" d="M5 12.2h8" stroke-width="2"/>`,
  working: () => '<g class="trail"><path class="d" transform="translate(0 1)" d="M2 13q2.25-3 4.5 0t4.5 0"/><path class="f" d="M2 13q2.25-3 4.5 0t4.5 0"/></g><g class="nib"><path class="paper" d="M11 13l1.2-4.2 3.6-3.6a1.3 1.3 0 0 1 1.8 1.8l-3.6 3.6z"/><path class="fill" d="M11 13l1.2-4.2 3.6-3.6a1.3 1.3 0 0 1 1.8 1.8l-3.6 3.6z" opacity=".22"/><path class="f" d="M11 13l1.2-4.2 3.6-3.6a1.3 1.3 0 0 1 1.8 1.8l-3.6 3.6zM11 13l2.6-2.6"/></g>',
  done: () => '<circle class="d" transform="translate(0 1)" cx="9" cy="9.2" r="6.5"/><circle class="f rg" cx="9" cy="9.2" r="6.5" transform="rotate(-90 9 9.2)"/><path class="f tick" d="M6.1 9.4l2 2 3.9-4.3" stroke-width="1.8"/>',
  answered: () => '<path class="d" transform="translate(0 1)" d="M3 3.5h12a1.5 1.5 0 0 1 1.5 1.5v6.5a1.5 1.5 0 0 1-1.5 1.5H8l-3.2 2.8V13H3a1.5 1.5 0 0 1-1.5-1.5V5A1.5 1.5 0 0 1 3 3.5z"/><path class="f" d="M3 3.5h12a1.5 1.5 0 0 1 1.5 1.5v6.5a1.5 1.5 0 0 1-1.5 1.5H8l-3.2 2.8V13H3a1.5 1.5 0 0 1-1.5-1.5V5A1.5 1.5 0 0 1 3 3.5z"/><path class="f l1" d="M5 6.8h7"/><path class="f l2" d="M5 9.5h4.6"/>',
}
export const sg = (state: Stage, clip = `sgc${++clipN}`) => `<svg class="sg sg-${state}" viewBox="0 0 18 18" aria-hidden="true">${SG[state](clip)}</svg>`
export function ring(state: string, av: number) {
  return `<span class="status-ring ring-${state}" style="--rs:${av + 8}px"><svg viewBox="0 0 34 34" aria-hidden="true"><circle class="rt" cx="17" cy="17" r="15.5"/><circle class="ra" cx="17" cy="17" r="15.5" pathLength="98"/><circle class="rb" cx="17" cy="17" r="15.5" pathLength="98"/></svg><span class="av agent" style="--s:${av}px" role="img" aria-label="Your agent"><svg viewBox="0 0 100 100" aria-hidden="true"><use href="#agent-mark"/></svg></span></span>`
}
export function motif(intent: Intent) {
  const g = IG[intent]
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="260" height="260" viewBox="-3 -3 26 26"><style>.d *{fill:#000}.d .gd{fill:#fff}.d .ln{fill:none;stroke:#000;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}</style><defs><mask id="c" maskUnits="userSpaceOnUse" x="-3" y="-3" width="26" height="26"><rect x="-3" y="-3" width="26" height="26" fill="#fff"/><g class="d">${g.detail}</g></mask></defs><g transform="rotate(-9 10 10)"><g mask="url(#c)">${g.shape}</g></g></svg>`
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
}
export const INTENTS: Intent[] = ["fix", "change", "question", "keep"]
export const LABEL: Record<Intent, string> = { fix: "Fix", change: "Change", question: "Question", keep: "Keep" }
