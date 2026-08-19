# Design Decisions — API Key Manager

Living record of architectural decisions and the reasoning behind them.
Update this file whenever a decision changes or a new one is made — don't
let it drift out of sync with the code.

---

## 1. Core entities

- **User** — account holder. Auth via email/password or Google OAuth.
- **Project** — a named container that access control (visibility, members)
  is granted against. Owns nothing directly except its own metadata.
- **ApiKey** — an independent secret, owned by exactly one `User`
  (`ownerId`). Not tied to a single project.
- **ProjectApiKey** — join collection. The *only* place that says "this key
  belongs to this project." Carries per-pairing data: `scopes`, `addedBy`.

## 2. ApiKey ↔ Project is many-to-many

**Decision:** a single `ApiKey` can be attached to multiple `Project`s, and
a `Project` can have multiple `ApiKey`s, via a `ProjectApiKey` junction
collection with a unique `{projectId, apiKeyId}` index.

**Why:**
- Access level (`READ`/`WRITE`) can differ per project for the *same*
  physical key — that only makes sense if scope lives on the junction, not
  on `ApiKey` itself.
- Avoids duplicating the same secret across multiple `ApiKey` documents if
  a user wants one key usable in several projects.

**Consequence:** `ApiKey` has no `projectId` field. Name uniqueness moved
from `{projectId, name}` to `{ownerId, name}`.

## 3. Access propagates from Project → its keys

**Decision:** users are never granted access to an individual key. They're
granted access to a `Project` (owner, or `members[].role`), and that access
fans out to every `ApiKey` linked to that project via `ProjectApiKey`.

**Why:** matches the mental model of "a project is a workspace, keys are
resources inside it" — same as GitHub repo permissions propagating to
files, not being set file-by-file.

## 4. Keys are recoverable — reversible encryption, not just a hash

**Decision (superseded from an earlier hash-only design):** `ApiKey`
stores the raw value in **two** forms, each serving a different purpose:

- `hashedKey` — SHA-256, one-way. Used **only** to authenticate incoming
  API requests: hash the presented key, exact-match against the unique
  index. Cannot be reversed, even with full DB access.
- `encrypted` — AES-256-GCM, reversible. Used **only** to let an
  authorized project member reveal the raw value in the UI. Decryption
  requires the app's master key (`API_KEY_ENCRYPTION_SECRET`, env var —
  ideally a KMS in production), not just DB access.

`prefix` (first 8 chars of the raw value) is still stored unhashed/
unencrypted so the UI can identify a key without revealing it.

**Why the reversal from "never stored":** the whole point of this app is
letting people working on the same project **share** API keys — a
teammate with access needs to actually retrieve the working secret, not
just see that a key exists. A one-way hash makes that structurally
impossible, so it doesn't fit the product. Reversible encryption is the
correct trade-off: still meaningfully protected (a DB dump alone is
useless without the master key), but recoverable by design for people
who are supposed to have it.

**Accepted risk:** whoever holds the master key, plus DB access, can
decrypt every stored key. The master key must be handled with at least as
much care as the secrets it protects — never logged, never committed,
rotated if ever suspected exposed. This is a deliberate trade-off for the
sharing feature, not an oversight.

**Who can reveal a key:** gated at the application layer by `Project`
membership via `ProjectApiKey` (see #3) — any member with access to a
project can reveal keys attached to it. Every reveal should be logged
(who, which key, when) — not yet built, tracked as an open question below.

## 5. Forking — project-level

**Decision:** a "fork" copies project *structure and key metadata*, and
**mints brand-new `ApiKey` documents with new raw secrets** — it never
copies or exposes the original raw key.

**Why:** the raw value was never stored anywhere (see #4), so there is
nothing to literally copy. Even if there were, handing another user the
same literal secret is a credential-sharing problem, not a fork. This
mirrors "fork a repo that ships `.env.example`, not `.env`" — you get the
shape, you generate your own values.

**Result of a fork:**
- New `Project`, owned by the forking user, `forkedFrom` pointing at the
  source project.
- New `ApiKey` + `ProjectApiKey` rows for every key that was attached to
  the source project, same `name`/`scopes` as the originals, brand-new
  `hashedKey`/raw value.
- All newly-minted raw keys are shown to the user **at once**, in a batch
  reveal screen, immediately after the fork completes (same "copy now, you
  won't see it again" pattern as single-key creation).

## 6. Forking requires the source project to be PUBLIC

**Decision:** only `Project.visibility === "PUBLIC"` projects can be
forked. Private projects cannot be forked, even by their own members.

## 7. Forked projects are always PRIVATE (deliberate deviation from GitHub)

**Decision:** a forked project's `visibility` is always set to `PRIVATE`
at fork time, regardless of the source project's visibility, with no
option to fork-as-public.

**Why this differs from GitHub:** GitHub can't let you flip a fork private
because forks share commit history/object storage with the parent —
visibility is entangled with shared git objects. Our forks share nothing;
every `ApiKey` is a fully independent, freshly-generated document. That
constraint doesn't apply here.

More importantly, the thing being forked is **secrets, not code**. Someone
forking a public starter project almost certainly wants their own
freshly-minted keys private by default — nobody wants a brand-new API key
visible to the world just because the template it came from was public.

If a user wants their fork public later, that's a separate, explicit
visibility change made afterward — not a fork-time decision.

## 8. Deleting/revoking the original key does not affect forks

**Decision:** no reference from a forked `ApiKey` back to the key it was
forked from (no `sourceKeyId` by default). A fork is a snapshot copy, not
a live pointer.

**Why:** the forked user's `ApiKey` is a fully independent document. If the
original owner deletes or revokes their key, only their own `ApiKey` and
`ProjectApiKey` rows are touched — the fork keeps working until the
forking user revokes it themselves. A "live" fork that breaks when the
upstream key is deleted would mean one user's action silently breaks
another user's production credentials — unacceptable for a credentials
manager.

**Future option (not built by default):** a `forkedFromKeyId` field purely
for lineage/notification ("the key you forked from was revoked, consider
rotating") — explicitly opt-in, never wired to cascading deletes.

## 9. Single-key forking

**Decision:** supported, but as a **secondary** action layered on the same
mechanism as project forking — not a replacement for it, and not allowed
to create an orphaned key with no project.

**Why:** a key isn't a meaningful standalone unit in this model — access
control is granted at the project level (#3), so a key with no project
attachment has no access-control home. "Fork a single key" is implemented
as **"fork this key into one of my own existing projects"**: mints one new
`ApiKey` + one new `ProjectApiKey` row (reusing the exact same
regenerate-and-mint logic as a full project fork), rather than creating a
project-less key or auto-creating a throwaway project for it.

## 10. Fork eligibility: any user, any PUBLIC project

**Decision:** any authenticated user can fork any project with
`visibility === "PUBLIC"`. Project membership is not required — this is
independent of #6 (source must be PUBLIC), and confirms membership adds
no additional permission on top of that.

## 11. `forkCount` on Project

**Decision:** `Project.forkCount` (denormalized counter, like `keyCount`)
is added, incremented on each successful fork. Powers a "N forks" UI
badge without a count query.

## 12. Reveal is available to any project member, regardless of role

**Decision:** any member of a project (owner, `READ`, or `WRITE`) can
reveal the raw value of any key attached to that project. `READ` vs
`WRITE` continues to gate *actions* (attach/detach/revoke a key,
create/update the project) but not *visibility* of key values —
visibility is controlled entirely by project membership itself (#3),
not by role within it.

## 13. No reveal audit log

**Decision:** "show raw key" actions are not logged. Considered and
explicitly declined — keeping the reveal path simple, with the project's
member list acting as the audit boundary (anyone who can see a key is
someone who was deliberately granted project access).

**Trade-off accepted:** if a key leaks, there's no record of which member
revealed it or when. This can be revisited later without a schema change
if it becomes a real need — logging can be added independently at any
time since it doesn't affect the reveal mechanism itself.

---

## Open questions / not yet decided

- Master key management: env var is the current approach; move to a real
  KMS (AWS KMS / GCP KMS / Vault) before production launch?