---
name: project-planning
description: >-
  Use when starting a new project, scoping an idea, choosing a stack, or
  producing an MVP implementation plan — an opinionated Bun/shadcn planning skill.
---

# Project planning

Turn a fresh project idea into a focused, MVP-first plan that favors prebuilt solutions and opinionated frameworks over custom complexity.

## Workflow

1. Clarify the goal in one sentence and define the single-user MVP boundary: what ships in the first cut, what is explicitly out of scope.
2. Decompose the goal into a small set of manageable tasks. Group by user-visible outcome, not by layer.
3. Research frameworks and libraries that could absorb whole tasks. Prefer pre-built solutions unless a clear constraint rules them out.
4. Start from an official scaffold or starter via `bunx create-*` (e.g. `bunx create-next-app`, `bunx create-vite`, `bunx create-t3-app`, `bunx create-tanstack`, `bunx create-expo`) instead of hand-rolling the skeleton.
5. Before any dependency install, create or preserve `bunfig.toml` with `[install] minimumReleaseAge = 259200`. Prefer scaffold flags that skip the initial install, then run `bun install`.
6. Pick an opinionated framework (e.g. Next.js, TanStack Start) when it improves organization. Skip framework-grade tooling for one-screen utilities.
7. For UI, initialize shadcn/ui with `bunx shadcn@latest init` and a minimalist preset. Pull components on demand.
8. Lay out components and services in a logical structure before coding.
9. Decide the minimum useful testing surface and git-hook surface (both default small).
10. Produce a short plan: goal, MVP scope, task list, stack choices with one-line rationale, deferred items.

## Planning rules

- Build for one user first.
- Use Bun as the runtime, package manager, and script runner by default.
- Start every new project from an official scaffold via `bunx create-*`.
- Every Bun project must include `bunfig.toml` with `minimumReleaseAge = 259200` under `[install]` before `bun install` or `bun add`.
- For UI, default to shadcn/ui with a minimalist preset.
- Prefer prebuilt over bespoke. Choose boring, well-documented defaults.
- Cut features before cutting clarity. Pick one opinionated framework per project.
- Organize by feature or domain once there is more than one screen.
- Write tests for critical logic only. Use git hooks for formatting and fast static checks only.
- Defer anything not on the path to a working MVP.

## Output shape

- Goal in one sentence
- Single-user MVP + explicit outs
- Outcome-oriented task list (vertical slices)
- Stack with one-line rationale each
- Deferred items and why
