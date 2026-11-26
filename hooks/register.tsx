import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import { casesDir, describe, isKarenSkill, isOffArgs, localDate, parseFrontmatter, statusText, summarize } from './cases'
import type { CaseInfo } from './cases'

const onAtom = atom({ plugin: 'karen', key: 'on' } as const, false)

// Set by a typed `/karen off`, so the skill expansion that follows doesn't switch the mode back on.
let offPending = false

async function loadCases($: EngineInterface): Promise<CaseInfo[]> {
  const home = (await $.env.get('USERPROFILE')) || (await $.env.get('HOME')) || ''
  if (!home) return []
  const dir = casesDir(await $.env.get('KAREN_HOME'), home)
  const sep = dir.includes('\\') ? '\\' : '/'
  let entries
  try {
    entries = await $.fs.list(dir)
  } catch {
    return []
  }
  const cases: CaseInfo[] = []
  for (const entry of entries) {
    if (entry.kind !== 'dir') continue
    try {
      const text = await $.fs.read(`${dir}${sep}${entry.name}${sep}case.md`)
      if (typeof text === 'string') cases.push({ folder: entry.name, ...parseFrontmatter(text) })
    } catch {
      // a folder without case.md is not a case
    }
  }
  return cases
}

// Mode off and reminders off: clear the line without touching the case store.
async function refresh($: EngineInterface, reminders: boolean, announce = false) {
  const on = await read($, onAtom)
  if (!on && !reminders) {
    $.ui.status(undefined)
    return
  }
  const summary = summarize(await loadCases($), localDate(new Date()))
  $.ui.status(statusText(on, summary, reminders))
  if (announce && reminders && summary.due.length) {
    $.ui.toast(`Karen: ${summary.due.map(describe).join('; ')}`, { timeoutMs: 8000 })
  }
}

export const register: Register = (on, options) => {
  // Off by default: unless the user turns reminders on, Karen stays silent until /karen is run.
  const reminders = options.reminders === true

  on('session.start', async ($, e, next) => {
    const result = await next(e)
    if (reminders) await refresh($, reminders, true).catch(() => undefined)
    return result
  })

  // Typed /karen: on, or off with `/karen off`.
  on('prompt.submit', async ($, e, next) => {
    const name = e.command?.name
    if (name && isKarenSkill(name)) {
      const off = isOffArgs(e.command?.args ?? '')
      offPending = off
      await update($, onAtom, () => !off)
      await refresh($, reminders).catch(() => undefined)
    }
    return next(e)
  })

  // Claude reaching for the skill itself also turns the mode on.
  on('skill.prompt', async ($, e, next) => {
    if (isKarenSkill(e.skill)) {
      if (offPending) {
        offPending = false
      } else if (!(await read($, onAtom))) {
        await update($, onAtom, () => true)
        await refresh($, reminders).catch(() => undefined)
      }
    }
    return next(e)
  })

  // Case files change during a turn; recount after each one while anything is shown.
  on('turn.complete', async ($, e, next) => {
    const result = await next(e)
    if (reminders || (await read($, onAtom))) await refresh($, reminders).catch(() => undefined)
    return result
  })
}
