---
name: agent-workflow
description: How an agent should work on this repository end to end - plan, build, verify, ship. Use at the start of any coding task here, and when delegating to a subagent.
---

# Agent workflow for Project-Web-Japan

The app lives in `memory-trip-app/`; CI is `.github/workflows/ci.yml`.

1. **Read first**: `memory-trip-app/AGENTS.md`, `docs/PLAN.md`, and the code you will touch.
   Do not rely on memory for Next.js 16 or Prisma 7 APIs.
2. **Small steps**: one concern per branch and PR; follow existing patterns in `features/`,
   `lib/`, `components/`.
3. **Security and performance are part of the task**, not a later pass: validate input,
   keep secrets server-side, avoid extra queries and heavy client code.
4. **Verify before saying done**: `npm run typecheck && npm run lint && npm test` from
   `memory-trip-app/`. For UI, also run the `ux-ui-check` skill.
5. **Review**: run the `code-review-project` skill on your own diff.
6. **Ship**: branch from `main`, commit with a clear message, open a PR, watch CI and fix
   failures at the root cause. Never skip tests, never force-push shared branches, never merge
   without the owner asking.
7. **Subagents**: give each one a self-contained prompt (goal, files, definition of done). Treat
   their report as a claim to verify, not a fact.
