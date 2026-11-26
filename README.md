# Karen for Claude Code

You know something's wrong, but writing the complaint feels like a second job. Type `/karen`, say what happened, and Claude writes it for you: calm, factual, and backed by the actual law.

Yes, the name is a joke. The letters aren't. They're polite and a bit boring on purpose: dates, order numbers and section numbers get refunds, and shouting gets a templated apology.

UK only (England, Wales, Scotland, Northern Ireland).

## Install

Copy this into Claude Code and let Claude do it:

```text
Install the Karen plugin for me. Run:
claude plugin install karen --marketplace NathnC/claude-karen
Then run `claude plugin list` to check it is enabled, and tell me to run /reload-plugins
(or start a new session) and type /karen.
```

Or type this at the Claude Code prompt:

```text
/plugin install karen --marketplace NathnC/claude-karen
```

Or from a terminal:

```bash
claude plugin marketplace add NathnC/claude-karen
claude plugin install karen@claude-karen
```

## Use

```text
/karen my new kettle started leaking after 3 weeks
/karen now my steak came out cold
/karen list
/karen kettle reply
/karen off
```

| Command | What it does |
| --- | --- |
| `/karen <what happened>` | Starts a case and drafts the complaint |
| `/karen now <what happened>` | You're at the counter. Three calm lines to say out loud |
| `/karen list` | Your open cases, overdue first |
| `/karen <case> reply` | They answered. Shows what they dodged or got wrong, and drafts your response |
| `/karen <case> chase` | They went quiet. A short follow-up |
| `/karen <case> escalate` | Next step: CEO office, ombudsman, section 75, letter before claim |
| `/karen <case> close won` | Records how it ended |
| `/karen off` | Leaves Karen mode |

While Karen mode is on, the status line says so, with your case counts:

```text
💅 KAREN MODE · 3 open · 1 overdue
```

With the mode off, Karen shows nothing: no status line, no startup reminder. To get deadline reminders outside Karen mode, turn on **Deadline reminders** for the karen plugin in `/config`. The status line then appears, and a toast at startup, only when a case is due or past.

## What you get

1. **An honest verdict first.** Strong, arguable, weak, or goodwill only. A meal you didn't like isn't a breach; a cold one is.
2. **Real law.** Every section is checked on legislation.gov.uk before it's quoted.
3. **The right people to send it to.** The complaints address, the CEO's office, the company's legal name, the right ombudsman. Each comes with where it was found, and guesses are marked as guesses.
4. **A draft, never a sent email.** It goes into your Gmail drafts if Gmail is connected, or a file if not. Nothing is sent unless you say "send it".
5. **A case file** in `~/.karen/cases/` with the timeline, evidence, deadlines and every message. Set `KAREN_HOME` to keep it elsewhere.

## What Karen won't do

Exaggerate your story, use a bad review as a threat, call anyone a scammer without proof, pretend to be a solicitor, or let you claim the same money twice. If they've made a fair offer, she'll tell you to take it.

This is information, not legal advice. For large sums, injury, work or housing cases heading to court, talk to Citizens Advice or a solicitor.

## Develop

```bash
claude plugin validate .
claude plugin test .
claude --plugin-dir .
```

Tested on Claude Code 2.1.330. The status line uses the function hooks plugin API, which is still in early access, so a future Claude Code release could break it. `/karen` itself would still work.

## Uninstall

```bash
claude plugin uninstall karen@claude-karen
claude plugin marketplace remove claude-karen
```

Your cases stay in `~/.karen/` until you delete them.

## License

MIT
