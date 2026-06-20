---
status: proposed
tags: [override, bypass, planning-only, ats]
appliesTo: [α, β, γ, δ, ε]
supersedes: null
---

# ATS Planning-Only Override & Bypass Workflow Spec

> **Planning artifact.** This document describes *what* the override/bypass
> workflow should be. It deliberately contains **no execution wiring** — no
> runnable code, no schematic hooks, no registry registrations, no CI
> mutations. It exists to be reviewed and merged so that a later, separate
> execution stage can implement it against agreed architectural decisions.

## 1. Purpose & Scope (planning-only; NO execution wiring)

### 1.1 Purpose

The **Agent Trigger System (ATS)** coordinates five autonomous specialist
agents that participate in stdLibSchema verification/correction workflows.
Each agent may *veto* a workflow step within its domain. Vetoes protect
architectural integrity, but a rigid veto with no escape valve stalls
legitimate work. This spec defines a disciplined **override** mechanism (relax
a veto under stated conditions) and a **bypass** mechanism (skip a check
entirely under sanctioned conditions), together with the audit trail that
makes either action accountable and reversible.

### 1.2 In Scope

- The override **taxonomy** (soft / hard / bypass) and the fail-mode of each.
- The **trigger table** mapping each agent's signals to an override class.
- A deterministic **decision tree** for resolving an override request.
- **Escalation** rules (retry-N → halt → human review).
- The **ADR** frontmatter schema used to record an override decision.
- The append-only **audit / event** record schema.

### 1.3 Out of Scope (explicitly deferred to the execution stage)

- Any concrete implementation in `specs/core`, `hub-core`, or schematics.
- Wiring overrides into the `RuleExecutor`, reporters, or CI workflows.
- Persistence backends, transport, or authentication for the audit log.
- UI/CLI surfaces for requesting or approving an override.

These are listed here only to set boundaries; they are **not** authorized by
the merge of this document. Merging this PR authorizes the *plan*, not the
*plumbing*.

## 2. Architectural Values

The workflow is designed to honor four values, in priority order. When two
values conflict, the higher-numbered (lower-priority) one yields.

| # | Value | Meaning | Practical consequence |
|---|-------|---------|-----------------------|
| 1 | **Audit integrity** | Every override/bypass is recorded immutably before it takes effect. | No silent overrides. "Record-then-act," never "act-then-maybe-record." |
| 2 | **Rollback-first** | A step is only allowed to proceed under override if its effects are reversible (or a reversal plan is captured). | Irreversible mutations cannot be soft-overridden. |
| 3 | **ACID-like semantics** | A workflow step is atomic, consistent, isolated, and durable with respect to its tree mutations. | Partial application is rolled back as a unit; overrides do not leave half-applied state. |
| 4 | **Module autonomy** | Each agent owns its veto domain; no agent may override another agent's domain. | Cross-domain conflicts escalate; they are never resolved unilaterally. |

> **Tie-break rule:** Audit integrity is non-negotiable. If the audit record
> cannot be written, the override is denied — fail-closed — regardless of the
> requested class.

## 3. Agent Roster & Veto Domains

Five agents (the `appliesTo` set). Each owns exactly one veto domain and may
only veto within it.

| Sigil | Agent | Veto domain | Example veto signal |
|-------|-------|-------------|---------------------|
| **α** | Architecture / Boundary | Module boundaries, dependency direction, layering | "ui → data direct import" |
| **β** | Security | Secrets, dependency vulnerabilities, unsafe config | "hardcoded token detected" |
| **γ** | Testing / QA | Coverage gates, failing/missing tests | "coverage 61% < gate 67%" |
| **δ** | Correction / Refactor | Tree mutations, reversibility, file writes | "non-reversible mass rename" |
| **ε** | Audit / Orchestration | Audit-log health, event ordering, workflow integrity | "audit sink unreachable" |

**Autonomy rule.** An override request targets exactly one agent's veto.
Agent ε is special: it is the *guardian of the record* and can hard-veto any
override whose audit write would fail (see §2 tie-break). ε never approves a
domain veto on behalf of α–δ.

## 4. Override Taxonomy (soft / hard / bypass — fail-mode per class)

| Class | Intent | Who can authorize | Effect on the veto | Reversibility precondition | Fail-mode |
|-------|--------|-------------------|--------------------|----------------------------|-----------|
| **Soft** | Proceed despite an *advisory* veto. | The owning agent (auto), within policy thresholds. | Veto downgraded to a logged warning; step proceeds. | Step effects must be reversible. | **Fail-open, logged** — on success the veto is downgraded to a logged warning and the reversible step proceeds. If the override evaluator itself errors, the step is *warned-and-allowed* only when reversibility holds (the error is logged); if effects are not reversible, the request falls through to the Hard path. |
| **Hard** | Proceed despite a *blocking* veto. | Requires authority **above** the owning agent: escalation/human approver. | Veto suspended for this step after explicit approval. | Reversal plan must be captured even if effects are reversible. | **Fail-closed, halt** — any error, missing approval, or audit-write failure ⇒ the step halts. |
| **Bypass** | *Skip the check entirely* (the agent does not run for this step). | Dual control: owning agent **and** ε, plus a scoped, expiring sanction. | The check is not executed; step proceeds as if no veto domain applied. | Effects must be reversible **and** a snapshot/rollback token captured first. | **Fail-closed, recorded** — bypass requires a successful append-only record *before* the skip; if recording fails, no bypass. |

**Class selection invariant:** Soft < Hard < Bypass in privilege. Privilege may
be *reduced* automatically (a Soft that fails its reversibility guard is
re-evaluated on the stricter Hard path; a Hard with no approval is denied and
escalated). Privilege is never *increased* automatically — moving a request to
a more permissive class (toward Bypass) always requires a human in §7.

## 5. Trigger Table (agent → signal → condition → class → fail-mode)

This table is the canonical mapping the decision tree (§6) consults. It is
illustrative of the planned policy, not an executable config.

| Agent | Signal | Condition (when an override may be considered) | Default class | Fail-mode |
|-------|--------|------------------------------------------------|---------------|-----------|
| **α** | `boundary.violation` | Violation is in a file flagged `legacy: true` and a tracking issue exists | Soft | Fail-open, logged |
| **α** | `dependency.direction` | New cross-layer edge in non-legacy code | Hard | Fail-closed, halt |
| **β** | `secret.detected` | Match is a known false-positive fixture (entropy allowlist) | Soft | Fail-open, logged |
| **β** | `dependency.vuln` | CVE severity ≥ high, no patched version available | Hard | Fail-closed, halt |
| **γ** | `coverage.below_gate` | Delta is test-only files; production coverage unchanged | Soft | Fail-open, logged |
| **γ** | `tests.failing` | Failure is a known-flaky test on the quarantine list | Soft | Fail-open, logged |
| **δ** | `mutation.large` | Mutation is reversible, snapshot/rollback token captured, scoped sanction in effect | **Bypass** | Fail-closed, recorded |
| **δ** | `mutation.irreversible` | Effect cannot be rolled back (no reversal possible) | **None** (override denied) | Fail-closed, halt |
| **ε** | `audit.sink_unreachable` | Audit log cannot be written | **None** (override denied) | Fail-closed, halt |
| **ε** | `event.out_of_order` | Sequence gap detected in event stream | Hard | Fail-closed, halt |

> **Reading the table:** "Default class" is the *most permissive* class the
> policy will entertain for that signal. The decision tree may still deny or
> escalate. Two rows are hard floors that admit **no** override and route
> straight to halt / human review: ε `audit.sink_unreachable` (no durable
> record ⇒ nothing proceeds) and δ `mutation.irreversible` (no rollback ⇒ the
> rollback-first value, §2, forbids every class).

## 6. Override Decision Tree

```mermaid
flowchart TD
    A([Veto raised by agent X]) --> B{Override<br/>requested?}
    B -- No --> H[Honor veto: halt step]
    B -- Yes --> C{Audit sink<br/>writable?}
    C -- No --> H2[Deny override · fail-closed · halt]
    C -- Yes --> D{Lookup signal<br/>in Trigger Table §5}
    D -- No match --> H[Honor veto: halt step]
    D -- Match --> E{Default class?}

    E -- None (denied) --> H2
    E -- Soft --> S1{Effects<br/>reversible?}
    S1 -- Yes --> S2[Record event · downgrade veto to warning · PROCEED]
    S1 -- No --> E2

    E -- Hard --> E2[Hard path]
    E2 --> HA{Approval present?<br/>authority &gt; agent X}
    HA -- No --> R[Escalate · see §7]
    HA -- Yes --> HB{Reversal plan<br/>captured?}
    HB -- No --> R
    HB -- Yes --> HC[Record event + approval · suspend veto · PROCEED]

    E -- Bypass --> BP{Dual control:<br/>agent X AND ε?}
    BP -- No --> R
    BP -- Yes --> BQ{Scoped sanction<br/>valid & unexpired?}
    BQ -- No --> R
    BQ -- Yes --> BR{Snapshot /<br/>rollback token?}
    BR -- No --> H2
    BR -- Yes --> BS[Record event (append-only) · SKIP check · PROCEED]

    R --> RT{Retries<br/>&lt; N?}
    RT -- Yes --> D
    RT -- No --> HR[Halt · queue for HUMAN REVIEW §7]
```

## 7. Escalation Paths (retry-N → halt → human review)

Escalation is the only path that can *upgrade* an override class, and only a
human approver may do so.

1. **Retry-N (bounded, idempotent).**
   - Transient denials (e.g., approval pending, sanction not yet propagated)
     re-enter the decision tree up to **N** times (planning default: `N = 3`).
   - Retries must be idempotent: each attempt re-reads current state and
     writes a *distinct* append-only event (`attempt: i`). No retry mutates
     the tree.
   - Backoff between attempts is policy-defined (planning suggestion:
     exponential 2s/4s/8s) and recorded.

2. **Halt (safe stop).**
   - On exhausting retries, or on any fail-closed condition, the step **halts**
     in a consistent state (per §2 value 3). Any partial mutation is rolled
     back as a unit. A `halted` event is recorded with the terminal reason.

3. **Human review (authoritative resolution).**
   - A halted request is queued for a human approver whose authority exceeds
     the owning agent's domain.
   - The human may: (a) **approve** an override (possibly upgrading the class,
     capturing a reversal plan / sanction), (b) **deny** and keep the veto, or
     (c) **amend** policy via an ADR (§8) so future identical signals resolve
     without halting.
   - Every human action is itself an append-only event (§9) carrying the
     approver identity and rationale.

> **No auto-escalation past human review.** The tree never loops back from
> human review to automatic processing without a recorded human decision.

## 8. ADR Integration

Override decisions of lasting consequence (any **Hard** or **Bypass**, and any
human **policy amendment**) are captured as an Architecture Decision Record so
the rationale outlives the event log.

### 8.1 ADR Frontmatter Schema

```yaml
---
id: ADR-OVR-<zero-padded-seq>      # e.g. ADR-OVR-0007
status: proposed | accepted | superseded | reverted
date: YYYY-MM-DD
tags: [override-trigger]           # REQUIRED discriminator tag
agent: α | β | γ | δ | ε           # owning veto domain
overrideClass: soft | hard | bypass
signal: <trigger-table signal id>  # e.g. dependency.direction
condition: <free-text or condition id matching §5>
failMode: fail-open-logged | fail-closed-halt | fail-closed-recorded
reversibility: reversible | reversible-with-plan | irreversible
approver: <identity | "auto">      # "auto" only for soft
relatedEvents: [<eventId>, ...]    # links into §9 audit stream
supersedes: <ADR id | null>
---
```

### 8.2 Rules

- The `tags` array **must** contain `override-trigger`; this is how tooling (in
  a later stage) will discover override ADRs.
- `approver: auto` is permitted **only** when `overrideClass: soft`.
- `overrideClass: bypass` **requires** `reversibility: reversible-with-plan`
  (or `reversible`) — never `irreversible` without a captured rollback token.
- An ADR that changes policy sets `status: accepted` and is referenced from the
  amended row of the Trigger Table (§5) in a follow-up edit.

## 9. Audit / Event Schema (append-only event record fields)

Every transition in §6 emits exactly one immutable event. Events are
append-only; corrections are *new* events that reference prior ones — records
are never edited or deleted.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `eventId` | string (uuid/ulid) | yes | Globally unique, sortable by creation. |
| `seq` | integer | yes | Monotonic per workflow run; ε flags gaps (§5 `event.out_of_order`). |
| `timestamp` | RFC 3339 string | yes | UTC; ordering authority is `seq`, not clock. |
| `workflowId` | string | yes | The orchestrated run this belongs to. |
| `stepId` | string | yes | The step the veto/override applies to. |
| `agent` | enum α/β/γ/δ/ε | yes | Owning veto domain. |
| `signal` | string | yes | Trigger-table signal id (§5). |
| `phase` | enum | yes | `veto-raised` \| `override-requested` \| `evaluated` \| `proceeded` \| `escalated` \| `halted` \| `human-decided`. |
| `overrideClass` | enum/null | conditional | Set once a class is chosen; null at `veto-raised`. |
| `decision` | enum | conditional | `allow` \| `deny` \| `skip` \| `retry` \| `escalate`. |
| `failMode` | enum/null | conditional | Class fail-mode actually applied; null until a class is chosen. |
| `reversibility` | enum | yes | Snapshot of the reversibility judgment. |
| `rollbackToken` | string/null | conditional | Required for `bypass` proceed. |
| `attempt` | integer | yes | Retry counter (0-based); supports §7 retry-N. |
| `approver` | string/null | conditional | Identity or `auto`; required for hard/bypass `allow`. |
| `rationale` | string | conditional | Required on `human-decided`. |
| `prevEventId` | string/null | yes | Back-link forming the per-step chain. |
| `adrRef` | string/null | conditional | ADR id when the event is governed by §8. |
| `integrityHash` | string | yes | Hash over the canonical event + `prevEventId` (tamper-evidence). |

**Invariants**

- **Record-then-act:** the `evaluated`/`proceeded`/`skip` event is durably
  appended *before* the step's effect is applied (§2 value 1).
- **Chain integrity:** `prevEventId` + `integrityHash` form a per-step hash
  chain; a broken chain is itself an ε veto condition.
- **No deletes:** a mistaken event is corrected by appending a compensating
  event that references it via `prevEventId`.

## 10. Open Questions

1. **Authority model.** How is "authority above the owning agent" defined for
   Hard overrides — a fixed role map, a per-domain approver list, or a quorum?
2. **Sanction scope & TTL.** For Bypass, what is the default sanction lifetime,
   and is it per-step, per-workflow, or time-boxed across runs?
3. **Retry-N default.** Is `N = 3` with exponential backoff right for all
   signals, or should `N` be per-signal in the Trigger Table?
4. **Rollback token format.** Is a tree snapshot id sufficient, or do we need a
   semantic reversal plan (inverse operations) for δ's reversible-with-plan?
5. **Audit durability.** What counts as "durably appended" for the
   record-then-act invariant — local WAL, remote sink ack, or both?
6. **Cross-domain conflicts.** When two agents veto the same step (e.g., α and
   β), is resolution sequential (highest-priority value first) or does it
   always escalate to human review?
7. **ADR ↔ Trigger Table sync.** What process keeps §5 rows and accepted
   policy ADRs from drifting once the execution stage begins editing both?

---

*End of planning spec. Execution wiring is intentionally absent and is the
subject of a separate, post-approval stage.*
