# November — commudle-ng (Frontend)

You are operating in `commudle-ng`, the Angular frontend for Commudle. This
file governs sessions running directly in this repo, whether reached
standalone or as a delegate from the `root` orchestrator. Scope
here is fixed to frontend work — there's no ambiguity to resolve about which
repo a request belongs to, since you're already in it.

---

## Folder Structure

```
commudle-ng/
├── AGENTS.md
├── CLAUDE.md
├── .gitignore
├── .claude/
│   └── agents/                        (shims — see .november/agents/ for real content)
└── .november/  →  symlink into november-hq/frontend (separate repo, own
    │              git history — nothing under .november/ is tracked by
    │              this repo at all; see .gitignore)
    ├── local-settings.json            (personal, machine-specific)
    ├── local-settings.example.json
    ├── memory-bank.md
    ├── work-log.md
    ├── bug-history.md
    ├── INDEX.md
    ├── agents/
    │   ├── intake.md
    │   ├── mechanic.md
    │   ├── public-page-section-generator.md
    │   └── {more specialists — added as promoted}
    ├── docs/
    ├── rules/
    ├── specs/
    └── skills/
        ├── component-generator.md
        ├── public-page-section-generation.md
        └── hero-section-generation.md
```

---

## Session Start — Every Time

0. **Before anything else, unconditionally:** check that `.november`
   exists and is a valid symlink. If it's missing, broken, or a real
   directory instead of a symlink — stop immediately, ignore whatever the
   person actually asked for, and go straight to Initializing below,
   without waiting for the word "init." Never explore git history, never
   reconstruct missing content, never generate a replacement `CLAUDE.md`
   or any other file as a workaround — a broken `.november` is an `init`
   problem, not a content problem, and improvising around it produces
   exactly the kind of drift `init` exists to prevent.
1. Determine whether this session was delegated from `root` (its
   `AGENTS.md` and `local-settings.json` are already active for this
   session) or started standalone, directly in this repo.
2. **Delegated:** use the root session's `autonomy` setting already in
   effect — don't re-ask.
   **Standalone:** if `.november/local-settings.json` doesn't exist yet, or
   the person explicitly says "init", run Initializing below. Otherwise
   read it for `autonomy`.
3. Route the incoming request — see Workflow.

---

## Initializing

Standalone sessions only — a delegated session already has this settled at
the root. Runs automatically the first time `.november/local-settings.json`
doesn't exist here, or `.november` isn't a valid symlink; also runs any time
the person says "init" — safe and idempotent to repeat.

1. **Symlink check, always, regardless of local-settings.json:** verify
   `.november` exists and is a symlink pointing at a real
   `november-hq/frontend` directory.
   - **Missing, and `git status` shows deleted-but-uncommitted files under
     old paths** (`.november/`, `.kiro/`, `.amazonq/`, `docs/features/`,
     or similar) — this is leftover from a prior migration to the
     `november-hq` symlink system, not something to diagnose or
     reconstruct. State plainly what's being cleaned up, stage and commit
     the deletion (`git add -u` scoped to those paths, a plain commit
     message), then proceed to create the fresh symlink below. Don't ask
     permission to finalize a deletion that already happened on disk —
     only the commit was missing.
   - **Missing, no such git history** — ask for `november-hq`'s path (try
     `../november-hq` relative to this repo first, confirm rather than
     asking blind). If not found, ask directly: "Run `pwd` in november-hq's frontend or backend folder (whichever applies here) and paste the result." Then create it:
     `ln -s {november-hq path}/frontend .november`. If this session can't
     write here, print the exact command instead of running it.
   - **Either case:** also confirm `.gitignore` contains a `.november`
     line — add it if missing. Also verify `CLAUDE.md` still matches the
     one-line shim (`See @AGENTS.md for full project instructions.`) — if
     it's been overwritten with something else (a likely side effect of
     an earlier session improvising around a broken `.november`), flag it
     and restore the shim.
2. **Root path and role — always check, regardless of whether
   `local-settings.json` already exists:** if `root_path` isn't already
   stored, ask for it (try `../november-hq/root` relative to this repo
   first, confirm rather than asking blind; if not found, ask directly —
   "Run `pwd` in `november-hq/root` and paste the result"). Then ask "Are
   you a frontend developer, backend developer, or full-stack?" if role
   isn't already known. Write `root_path` and `role` into _this repo's_
   `local-settings.json`, and also write `role` and `autonomy` (see next
   step) into **root's own** `local-settings.json` at the stored path —
   same developer, same private gitignored clone, this is safe to do
   automatically, no separate confirmation needed for that second write.
   If role is full-stack, also collect the sibling repo's path the same
   way (`gdgapp` from here, or `commudle-ng` from there) and store it
   locally as `sibling_path`.
3. **If `local-settings.json` doesn't exist:** ask "How much autonomy do you
   want by default — checkpoint (confirm at each stage) or confident (fewer
   stops)?", default to `checkpoint` if declined, write the file (including
   `root_path`, `role`, and `sibling_path` if applicable from Step 2 above),
   confirm it was created.
4. **If it already exists:** report the current `autonomy` back to the
   person, and ask if it should change.

---

## Workflow

**Every request, without exception, first goes through `root`'s own
`intake.md`** — read via the path stored in `local-settings.json`, followed
exactly as if this were a root session, all within this same conversation.
Never tell the person to go start a separate session in `root` — that path
exists so this session can reach it directly, not as a fallback when it
can't. If the stored path is missing or broken, treat this the same as any
other broken setup: fix it via Initializing before proceeding, don't
improvise around it.

Root's `intake.md` classifies and determines scope, then this session
continues as whichever of the following applies:

- **Bug scoped to this repo** → continue as this repo's own
  `.november/agents/intake.md`: gather what's missing, check
  `.november/bug-history.md` and the relevant `.november/INDEX.md` entry,
  then hand off to an existing specialist, or work directly if no promoted
  specialist covers this area yet.
- **Bug needing the sibling repo** → only possible if role is full-stack
  and the sibling's path is stored; read/write there directly, same
  session, using its own `AGENTS.md`/`intake.md` for that portion.
- **Feature, arriving as a finished, approved spec** in `.november/specs/`
  → implement against it, checking `.november/rules/` and the relevant
  `INDEX.md` entries first.
- **Feature, not yet spec'd** → continue as root's own
  `feature-intake.md`, read via the stored path — full requirements
  conversation, Brainstorm Mode included, spec written to root's
  `.november/specs/` via that same path. Don't attempt to shortcut this
  locally.
- **Needs the Product Expert** → read root's `product-expert.md` via the
  stored path when `feature-intake.md`'s own logic calls for it.
- **Agent-system request** (new agent/skill, rule change, file split) →
  this repo's own Mechanic if clearly scoped here; root's Mechanic if
  genuinely cross-cutting — same split as designed for Mechanic generally.
- **Question** (repo onboarding, "how does X work") → answer from
  `.november/INDEX.md` and the relevant doc in `.november/docs/`. If
  nothing covers it, say so, and offer to explore and write a new one on
  confirmation.
- **Public page section** (new section, new variant, modify an existing
  one) → route to the Public Page Section Generator agent directly, once
  root's initial pass confirms this is in scope here — this is its own
  recognized request shape, not routed through the generic bug/feature/
  question split.

---

## Agents At This Level

| Agent                         | File                                                | Job                                                                                                      | Trigger                                                                          |
| ----------------------------- | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Intake                        | `.november/agents/intake.md`                        | Classify type, gather bug detail, route to a specialist                                                  | Standalone bug or question requests                                              |
| Mechanic                      | `.november/agents/mechanic.md`                      | Improve this repo's agent-system infrastructure — new agents/skills, file splits, permanent rule updates | Explicit invocation, or agent-system requests routed from Intake — never ambient |
| Public Page Section Generator | `.november/agents/public-page-section-generator.md` | Build reusable section components for public/display pages, reuse-checking before creating anything new  | Requests to generate or modify a public page section (e.g. a new hero variant)   |

More get added here only as promoted from ephemeral use — see Self-Update Policy.

---

## Resources

| File                       | Contents                                                                                                                                                                                                                                   | Who writes                                                                               |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| `.november/INDEX.md`       | Module name → file path → one-line description                                                                                                                                                                                             | Agents propose, you confirm                                                              |
| `.november/docs/`          | Comprehensive, verified feature documentation — one file per feature, covering admin + public sides, routes, services, models, and backend API routes                                                                                      | Verified docs written by you or your developers; agents may propose updates, you confirm |
| `.november/rules/`         | Angular conventions and styling — frontend-specific only. Git commit format, branch naming, and PR process apply identically across every repo and live at `root/.november/resources/git-and-code-review.md` instead, not duplicated here. | You; agents propose, you confirm                                                         |
| `.november/specs/`         | Feature specs — frontend-only ones built at the root, full-stack ones arrive here for the frontend half                                                                                                                                    | feature-intake (root) writes; you approve                                                |
| `.november/skills/`        | Task-specific generation guides (e.g. component generator)                                                                                                                                                                                 | You; agents propose, you confirm                                                         |
| `.november/bug-history.md` | Frontend-only bug fixes                                                                                                                                                                                                                    | Auto-logged by agents                                                                    |
| `.november/memory-bank.md` | Standing rules from "Add to Memory Bank" instructions                                                                                                                                                                                      | Written on explicit trigger only                                                         |
| `.november/work-log.md`    | Completed-work summaries and ongoing/paused investigations, on request                                                                                                                                                                     | Drafted on "Log this work," you confirm, then written                                    |

Read on demand only — nothing here is preloaded at session start.

---

## Self-Update Policy

Same as the root: agents never modify their own spec files, this file, or
anything in `.november/agents/` without explicit confirmation.
`memory-bank.md` and `bug-history.md` are the exceptions — always
auto-updated, no gate, because they're pure append-only logs where a new
entry can't contradict or degrade what's already there. `.november/docs/`
is **not** one of these exceptions, even though a similar folder used to
be — it holds verified, developer-authored reference documentation now,
not agent-accumulated notes, and an agent silently editing a coherent
written doc carries real risk a pure log entry doesn't. Agents may
_propose_ an addition or correction when they learn something concrete,
same confirmation gate as everything else.

---

## Hard Rules

- "Add to Memory Bank: X" is a direct instruction, not a suggestion — check `.november/memory-bank.md` for a matching entry; no match → add it, scope noted; match found → increment `⚠️ VIOLATED ×N`, move to top. Immediate, no confirmation needed.
- "Log this work" drafts a `.november/work-log.md` entry and shows it for confirmation before writing — never auto. Completed work: one closed entry. An ongoing/failed-attempts investigation or a paused discussion: match by topic against existing entries and extend the same one, don't create a new entry per session. If the type is unclear, ask once.
  When a new request plausibly matches an open investigation, check `.november/work-log.md` before starting fresh.

- Never touch `gdgapp` from a session running in this repo, even if it's
  technically reachable — cross-repo coordination is `root`'s job,
  not this file's.
- Touch only what was asked. Never refactor, optimize, or clean up
  surrounding code that wasn't part of the request — no exceptions for
  code that "looks like it could use it" while you're already in the file.
- New feature requests always route to `root`'s Feature Intake —
  never attempt to determine scope or gather feature requirements locally.
- One question at a time, always.
- When more than one open question or item needs raising in the same
  response, collect them as trailing bullets at the end — never embed
  them individually inside separate paragraphs, where they're easy to
  read past without noticing.
- Never assume approval. Input is not consent.
- The entire `.november` is a symlink into `november-hq` (a separate repo)
  — nothing under it is tracked by this repo's own git history, not just
  `local-settings.json`. `local-settings.json` itself stays untracked even
  inside `november-hq`, since it's personal and machine-specific — only
  `local-settings.example.json` is committed there.
