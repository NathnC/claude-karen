import { expect, test } from 'claude-code/testing'

import { casesDir, daysBetween, dueCases, isKarenSkill, isOffArgs, localDate, parseFrontmatter, statusText, summarize } from '../hooks/cases'

test('parseFrontmatter reads flat keys, strips comments, handles CRLF and BOM', () => {
  expect(parseFrontmatter('\uFEFF---\r\ntitle: "Cold pizza"\r\nstatus: open   # open | won\r\n---\r\nbody'))
    .toEqual({ title: 'Cold pizza', status: 'open' })
  expect(parseFrontmatter('no frontmatter')).toEqual({})
})

test('parseFrontmatter keeps # inside quoted values', () => {
  expect(parseFrontmatter('---\ntitle: "Order #123 never arrived"  # note\nref: \'#55\'\n---'))
    .toEqual({ title: 'Order #123 never arrived', ref: '#55' })
})

test('casesDir honours KAREN_HOME, expands ~, defaults to ~/.karen', () => {
  expect(casesDir('/x/', '/h')).toBe('/x/cases')
  expect(casesDir('~/k', '/h')).toBe('/h/k/cases')
  expect(casesDir(undefined, '/h')).toBe('/h/.karen/cases')
  expect(casesDir(undefined, 'C:\\Users\\me')).toBe('C:\\Users\\me\\.karen\\cases')
})

test('dates are calendar days in local time', () => {
  expect(localDate(new Date(2026, 10, 24, 23, 59))).toBe('2026-11-24')
  expect(daysBetween('2026-11-24', '2026-11-23')).toBe(-1)
  expect(daysBetween('2026-03-28', '2026-03-30')).toBe(2)
})

const CASES = [
  { folder: 'a', status: 'open', next_deadline: '2026-11-26' },
  { folder: 'b', status: 'waiting', next_deadline: '2026-11-20' },
  { folder: 'c', status: 'won', next_deadline: '2026-11-20' },
  { folder: 'd', status: 'open', next_deadline: '2026-12-10' },
  { folder: 'e', status: 'open' },
  { folder: 'f', status: 'open', next_deadline: 'soon' },
]

test('dueCases keeps open, dated cases within two days, overdue first', () => {
  expect(dueCases(CASES, '2026-11-24').map(c => [c.folder, c.days])).toEqual([['b', -4], ['a', 2]])
})

test('statusText: always on in Karen mode, otherwise only when something is due', () => {
  const s = summarize(CASES, '2026-11-24')
  expect(s).toEqual(expect.objectContaining({ open: 5, overdue: 1, soon: 1 }))
  expect(statusText(true, s)).toBe('💅 KAREN MODE · 5 open · 1 overdue · 1 due soon')
  expect(statusText(false, s)).toBe('💅 Karen · 1 overdue · 1 due soon · /karen list')
  const quiet = summarize([{ folder: 'd', status: 'open', next_deadline: '2026-12-10' }], '2026-11-24')
  expect(statusText(true, quiet)).toBe('💅 KAREN MODE · 1 open')
  expect(statusText(false, quiet)).toBeUndefined()
})

test('command matching', () => {
  expect(isKarenSkill('karen')).toBe(true)
  expect(isKarenSkill('karen:karen')).toBe(true)
  expect(isKarenSkill('karenx')).toBe(false)
  expect(isOffArgs(' OFF ')).toBe(true)
  expect(isOffArgs('off my steak is cold')).toBe(false)
})
