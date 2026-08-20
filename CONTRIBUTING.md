# Contributing

Bug reports, method coverage fixes and BaseLinker API corrections are all welcome.

## Getting set up

```bash
npm install
npm run build
npm test
```

Tests run entirely offline — `fetch` is stubbed and no BaseLinker call is made. If you
want to exercise the real API, put a token in `.env` and run `npm run smoke`.

## Before opening a pull request

```bash
npm run check      # format check, typecheck and tests
```

## How the tool surface is built

Every BaseLinker API method is one entry in `src/categories/*.ts`:

```ts
{
  name: "getOrders",
  mode: "read",                       // "read" or "write" — decides visibility
  description: "…, including pagination hints",
  schema: z.object({ order_id: z.number().optional() }),
}
```

`src/registry.ts` groups those into the ten category tools, and `src/server.ts` turns each
category into a single MCP tool taking `{ method, parameters }`. Adding a method means
adding one entry — no wiring anywhere else.

Two rules that are easy to miss:

- **`mode` must be honest.** Anything that changes state is `"write"`, even if BaseLinker
  named it `get*`. The read-only guarantee depends on this field alone.
- **Schemas stay permissive about unknown keys.** BaseLinker adds parameters without
  notice, and unknown keys are forwarded untouched so the server does not break when they
  do. Validate what you know; do not use `.strict()`.

## Style

The codebase matches what is already there rather than a written rulebook:

- No comments. Names carry the meaning; if a line needs a comment, it usually needs a
  better name. The exception is a genuinely surprising external constraint.
- Small functions, one level of abstraction each, early returns over nesting.
- No `null` — use `undefined` and optional properties.
- Prettier settles all formatting; `npm run format` fixes it.

## Tests

Vitest, named `methodNameGivenSomeStateWhenSomethingHappensThenOutcome`. Each test builds
its own fixtures and depends on no other test. Prefer injecting a fake (`fetchFn`,
`limiter`, `keyStore`) over reaching for module mocks — every unit in `src/` takes its
dependencies through its constructor for exactly this reason.

## Security

Do not open a public issue for anything exploitable — see [SECURITY.md](SECURITY.md).
