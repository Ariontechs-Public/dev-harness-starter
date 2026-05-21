# Cross-Model Runner — Design Spec

- **Date:** 2026-05-22
- **Status:** Draft (awaiting user review)
- **Author:** brainstorming session (Nat + Claude)

## Problem

`dev-harness-starter` demonstrates "same model, the only difference is the harness
layer." Today the only way to feel that difference is to drive it interactively
through a developer's own Claude Code client. That has two limits:

1. **Client settings leak.** A developer's personal `~/.claude` config (global
   `CLAUDE.md`, custom skills like `graphify`, the repo's own DoR/Stop hooks) can
   influence the run, so results are not reproducible across people.
2. **Single vendor.** Interactive Claude Code only exercises Claude models. We
   cannot show the harness effect *across* models from different vendors.

## Goal

A thin, scriptable **runner** that reproduces the demo's comparison
(`harness ON` vs `harness OFF`) across multiple models, hermetically — without
loading any client-side skill or hook. Output is a comparison matrix that makes
"the difference is the harness, not the model" legible at a glance.

Non-goals (for v1):

- Not a general-purpose coding agent. It drives *this repo's* task files only.
- Not a multi-turn tool-using agent loop (see Alternatives).
- Not a replacement for the interactive Claude Code demo — a complement to it.

## Background: how opencode reaches many models

opencode does not hit a single "Messages API." Each vendor's wire format differs
(Anthropic Messages, OpenAI Chat Completions, Gemini, …). opencode unifies them
with the **Vercel AI SDK** (one `generateText`/`streamText` interface, one adapter
per vendor) and uses **models.dev** as the catalog of model capabilities/pricing.
Models are selected by a `provider/model` string. We mirror that abstraction so
swapping models is a one-string change.

## Approach

TypeScript (matches the `sample-app` Node/TS + bash-gate stack) + Vercel AI SDK.

Per the harness comparison, each run is **one model turn** (no tool loop) followed
by a **deterministic post-step** that applies the model's output and runs the real
`gate/gate.sh`. This reproduces both demo punchlines while staying thin and
trivially cross-vendor (single-turn text generation needs no per-vendor tool-call
handling).

### Component layout

```
runner/
  run.ts        # entry: sweep (task × model × harness) → collect results
  harness.ts    # builds the ON/OFF prompt context
  gate.ts       # apply model output to a throwaway copy, run gate/gate.sh
  models.ts     # the provider/model list to sweep + provider wiring
  report.ts     # write docs/runs/<date>.md comparison matrix
  package.json  # depends on `ai` + provider adapters; own tsconfig
```

`runner/` is self-contained. It does **not** modify `sample-app` logic, the gate
scripts, `CLAUDE.md`, or `.claude/`. It is hermetic by construction: it builds its
own system prompt and never loads `~/.claude` skills or hooks.

### Harness ON vs OFF (`harness.ts`)

- **OFF (naive):** system prompt is empty/minimal; user message is the bare
  contents of the chosen `TASK-*.md`. Nothing else.
- **ON:** system prompt = contents of repo `CLAUDE.md` + the DoR reminder text
  emitted by `gate/dor-reminder.sh`; user message is the same `TASK-*.md`.

Both branches read the *repo's* files at runtime, so the comparison always tracks
whatever the harness currently says.

### Run flow (`run.ts`)

For each `(task, model, mode∈{off,on})`:

1. Build messages via `harness.ts`.
2. One `generateText({ model, system, prompt })` call through the AI SDK.
3. Classify the reply:
   - **askedFirst** — did the model ask a clarifying question (UI spec /
     reproduction steps) instead of producing code? Detected by a small set of
     heuristics (no code fence + presence of a question / request for spec).
   - For the coupon task: extract the produced `applyDiscount` implementation and
     hand it to `gate.ts`.
4. Record a result row.

### Gate post-step (`gate.ts`)

For tasks that produce code (coupon, bug):

1. Copy `sample-app/src/discount.ts` (plus whatever `gate/gate.sh` needs) into a
   temp working dir.
2. Splice the model's `applyDiscount` into the copy.
3. Run `bash gate/gate.sh` against the copy; capture exit code + output.
4. Return `{ gatePassed: boolean, output: string }`.

If the model asked-first and produced no code, gate is recorded as `n/a`.

### Models (`models.ts`)

A list of `provider/model` strings. v1 default uses **OpenRouter**
(`@openrouter/ai-sdk-provider`) so one key reaches Claude / GPT / Gemini; direct
`@ai-sdk/anthropic` and `@ai-sdk/openai` keys are also honored when present. Keys
come from environment variables only (e.g. `OPENROUTER_API_KEY`,
`ANTHROPIC_API_KEY`). No keys committed.

### Report (`report.ts`)

Writes `docs/runs/<YYYY-MM-DD-HHmm>.md`: a matrix with one row per model and
columns capturing, for each task, `askedFirst?` and `gate` (pass/fail/n-a) under
both OFF and ON. A short prose summary states whether the harness changed the
outcome independent of the model.

## Error handling

- Missing API key for a configured provider → skip that model with a clear note in
  the report, do not abort the whole sweep.
- Model call failure / timeout → record as `error` in that cell, continue.
- Gate apply failure (could not splice output) → record `apply-error`, continue.
- The sweep is best-effort and always produces a report, even if partial.

## Testing

- `harness.ts`: unit test that ON includes `CLAUDE.md` + DoR text and OFF does not.
- `gate.ts`: test against a known-good and known-bad `applyDiscount` fixture to
  confirm pass/fail detection (no live model needed).
- `report.ts`: snapshot test on a fixed results array.
- Live model calls are exercised manually (they cost tokens / need keys); they are
  not part of the automated test run.

## Alternatives considered

- **Full multi-turn agent loop** (model reads/edits files, runs gate, retries on
  failure). Most faithful — would capture live "gate fails → retry" footage — but
  needs per-vendor tool-calling and is much heavier. Deferred; the single-turn +
  post-hoc-gate design is a stepping stone to it.
- **Drive the real `opencode` CLI.** Reuses its 75+ providers, but couples us to
  its config/rules model and is heavier to make hermetic for this specific demo.
- **Claude Code headless (`claude -p --settings`).** Harness works as-is, but stays
  Claude-only — fails the cross-vendor goal.

## Open questions

- Exact heuristic for `askedFirst` classification — refine against real outputs.
- Whether to pin model versions in `models.ts` or pull live from models.dev.
