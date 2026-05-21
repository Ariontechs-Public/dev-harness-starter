# Cross-Model Runner

Drives this repo's task files through each model with the harness ON vs OFF,
runs the real gate on produced code, and writes a comparison matrix to
`docs/runs/<timestamp>.md`. Hermetic: builds its own system prompt, never loads
your `~/.claude` skills or hooks.

The harness ON/OFF difference is *only* `{repo CLAUDE.md + DoR reminder}`; the task
text and output-format note are held constant, so the comparison isolates the
harness layer — not the model.

## Setup

```bash
cd runner && npm install
```

Set at least one key (env vars only, never committed):

```bash
export OPENROUTER_API_KEY=...   # one key → Claude / GPT / Gemini
export ANTHROPIC_API_KEY=...    # optional, direct Anthropic
```

## Run

```bash
cd runner && npm run run
```

Edit the sweep in `src/models.ts` (which models) and `src/tasks.ts` (which tasks).
Each combination prints a line to stderr; the final matrix is written to
`docs/runs/<timestamp>.md`.

## Test

```bash
cd runner && npm test
```

`gate.test.ts` runs the real `gate/gate.sh` against known-good/known-bad
implementations and restores `sample-app/src/discount.ts` afterward. Live model
calls are exercised only by `npm run run` (they cost tokens / need a key) and are
not part of the automated test suite.
