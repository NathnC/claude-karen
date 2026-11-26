// Pure helpers for reading /karen case files. No engine calls, so tests run them directly.

export type CaseInfo = {
  folder: string
  title?: string
  against?: string
  status?: string
  next_action?: string
  next_deadline?: string
}

export type DueCase = CaseInfo & { days: number }

export type Summary = { open: number; overdue: number; soon: number; due: DueCase[] }

const CLOSED = new Set(['won', 'lost', 'dropped', 'closed'])
const DAY = 86400000

// The case store: $KAREN_HOME/cases, else <home>/.karen/cases. A leading ~ means home.
export function casesDir(karenHome: string | undefined, home: string): string {
  const sep = home.includes('\\') ? '\\' : '/'
  const base = karenHome ? karenHome.replace(/^~(?=$|[\\/])/, home) : `${home}${sep}.karen`
  return `${base.replace(/[\\/]+$/, '')}${sep}cases`
}

// The leading `---` block as flat `key: value` pairs. Enough for case.md; nested YAML is skipped.
export function parseFrontmatter(text: string): Record<string, string> {
  const block = /^﻿?---\r?\n([\s\S]*?)\r?\n---/.exec(text)?.[1]
  if (block === undefined) return {}
  const out: Record<string, string> = {}
  for (const line of block.split(/\r?\n/)) {
    const kv = /^([A-Za-z_][\w-]*):\s*(.*?)\s*$/.exec(line)
    const key = kv?.[1]
    if (!key) continue
    const raw = kv[2] ?? ''
    // A quoted value keeps any # inside it ("Order #123"); an unquoted one loses a trailing comment.
    const quoted = /^(['"])(.*?)\1(\s+#.*)?$/.exec(raw)
    out[key] = quoted ? (quoted[2] ?? '') : raw.replace(/\s+#.*$/, '')
  }
  return out
}

// Local calendar date: a deadline is a date where the user lives, not in UTC.
export function localDate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY)
}

export const isOpen = (c: CaseInfo) => !CLOSED.has((c.status ?? '').toLowerCase())

// Open cases whose next_deadline is past, today or within `window` days; overdue first.
export function dueCases(cases: CaseInfo[], today: string, window = 2): DueCase[] {
  return cases
    .filter(isOpen)
    .filter(c => /^\d{4}-\d{2}-\d{2}$/.test(c.next_deadline ?? ''))
    .map(c => ({ ...c, days: daysBetween(today, c.next_deadline as string) }))
    .filter(c => c.days <= window)
    .sort((a, b) => a.days - b.days)
}

export function summarize(cases: CaseInfo[], today: string): Summary {
  const due = dueCases(cases, today)
  return {
    open: cases.filter(isOpen).length,
    overdue: due.filter(c => c.days < 0).length,
    soon: due.filter(c => c.days >= 0).length,
    due,
  }
}

export function describe(c: DueCase): string {
  const when = c.days < 0 ? `${-c.days}d overdue` : c.days === 0 ? 'due today' : `due in ${c.days}d`
  return `${c.title || c.folder}${c.against ? ` (${c.against})` : ''} ${when}`
}

// The status line: always shown while Karen mode is on. With the mode off it shows only
// when reminders are switched on and a case needs attention; otherwise nothing at all.
export function statusText(on: boolean, s: Summary, reminders = false): string | undefined {
  const parts = [
    s.open ? `${s.open} open` : '',
    s.overdue ? `${s.overdue} overdue` : '',
    s.soon ? `${s.soon} due soon` : '',
  ].filter(Boolean)
  if (on) return ['💅 KAREN MODE', ...parts].join(' · ')
  if (reminders && (s.overdue || s.soon)) return ['💅 Karen', ...parts.slice(1), '/karen list'].join(' · ')
  return undefined
}

// `/karen off`, `/karen stop`, `/karen exit` end the mode; anything else starts it.
export const isOffArgs = (args: string) => /^\s*(off|stop|exit|quit)\s*$/i.test(args)
export const isKarenSkill = (name: string) => /^(karen:)?karen$/.test(name)
