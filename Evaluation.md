# Codebase Evaluation — Paththare-Ads

**Date:** 2026-06-27
**Question:** Is this codebase worth maintaining, or should it be rebuilt from scratch?
**Codebase:** ~23,800 LOC · 90 TS/TSX files · Next.js 16, React 19, TypeScript, Prisma + PostgreSQL, Redis sessions.

---

## 1. Verdict

> **Keep the code. Rebuild the foundation underneath it. Do NOT rewrite from scratch.**

A from-scratch rewrite is **not** justified. The valuable, hard-to-recreate part of this product — the pricing engine, the six publisher-specific PDF layouts, the multi-language matrix — is real, working, and lives only in this code (no spec, no tests). Rewriting means re-deriving all of that from people's memory, at high regression risk, while still having to migrate a live database.

But **"keep maintaining as-is" is unsafe.** Three foundation-level problems make every future change risky:

1. **Security is effectively non-functional** — multiple *unauthenticated* paths to admin data, password hashes, PII, and payments. Exploitable today.
2. **The database cannot be reproduced from the repo** — only the auth tables have a migration; ~25 business tables exist only as an introspected schema built by hand.
3. **There are zero tests** — no safety net to change anything against, while ~48% of the code sits in 4 files.

**Recommended approach:** treat it as a *strangler* rebuild — salvage the domain logic, rebuild the foundation (auth, schema-as-migrations, tests, server-side pricing). The security holes in §3 must be fixed first, regardless of the longer-term plan.

---

## 2. Grades

| Dimension | Grade | Summary |
|---|:---:|---|
| Security / authorization | **F** | Forgeable admin cookie; no server-side authz; unauthenticated PII + password-hash dump; payment & price forgery |
| Data model | **D-** | Mixed ID strategies, string "FKs", three category systems, denormalized pricing |
| Migrations | **F** | Only auth tables migrated; DB not reproducible from source |
| Tests | **F** | None. No runner, no specs |
| Architecture | **D** | No service layer; logic crammed into route handlers & god-components |
| Code quality | **D+** | 48% of code in 4 files; redundant libs; dead code; `any` lint rule disabled |
| Tech-stack *choices* | **B** | Core stack is right; library bloat & a few risky version picks |
| Tooling | **C-** | `strict` TS enforced at build (good); no CI; lint gates loosened |

---

## 3. Critical security findings (fix first — exploitable now)

All of these are reachable **without authentication**.

### 3.1 Forgeable admin session
The admin gate trusts a static, unsigned cookie.
- Set: `app/api/admin/login/route.ts:51` → `res.cookies.set("admin_auth", "true", …)`
- Checked: `app/admin/layout.tsx:18` → `cookieStore.get("admin_auth")?.value === "true"`
- **Exploit:** `curl -H 'Cookie: admin_auth=true' …/admin` → full access. `httpOnly` blocks JS *reads*, not an attacker *sending* the cookie.

### 3.2 No server-side authorization on any route
Role checks run **only in the browser** (`app/admin/components/RoleCheck.tsx:18-36`, reading a non-`httpOnly` `admin_roles` cookie set at `login/route.ts:58`).
- **Exploit:** `document.cookie = 'admin_roles=["SUPER_ADMIN"]'` → every check passes. **26 of 28 API routes have no auth at all** (full table in Appendix A).

### 3.3 Unauthenticated user dump + account takeover
- `GET /api/users` (`app/api/users/route.ts:4-9`) returns the whole users table **including `password_hash`**.
- `POST /api/users` (`:12-59`) lets anyone create a `SUPER_ADMIN`.
- `PUT/DELETE /api/users/[id]` (`app/api/users/[id]/route.ts:6,36`) edit/delete any user, reset passwords.

### 3.4 Price is client-controlled
Price is computed only in the browser (`StepSelectAdType.tsx:160-612`), sent raw (`post-ad/page.tsx:405`), and stored verbatim (`submit-ad/route.ts:144`). **There is no server-side pricing logic.**
- **Exploit:** POST `/api/submit-ad` with `price: 1` → that is the stored/charged amount.

### 3.5 Payment forgery
`app/api/ads/[reference]/proceed-payment/route.ts:22-35` sets `status: "PaymentDone"` and stores `amount` straight from the request body, with no token and no auth.

### 3.6 Reference numbers are sequential & enumerable
`submit-ad/route.ts:46-81` generates references as `newspaper-prefix + incrementing counter`. Given one reference you can enumerate every other ad — and the reference-keyed routes above have no auth. (Also a generation race: the retry loop wraps a read, not the unique `create`.)

### 3.7 File upload — path traversal + arbitrary write
`app/api/uploadNewspaperImage/route.ts:14-24` uses the client filename in `path.join(...)` + `fs.writeFileSync`, no auth, no type/size check.

### 3.8 `sendLink` undermines the one good security primitive
The tracking-token system (`lib/token.ts`, `track/*`) is cryptographically sound — but `track/sendLink/route.ts:11-39` mints a fresh 30-day valid token for **any** reference to **any** email, unauthenticated. Combined with 3.6, an attacker can take over someone else's ad workflow.

> **Silver lining:** a correct, server-side session/RBAC system already exists in `lib/auth.ts` (`createSession`, `getSession`, `requireAdmin`) — but it is **imported nowhere**. The proper middleware is also misplaced at `app/admin/middleware.ts`, where Next.js never runs it. **Most of the §3 fixes are wiring up code that is already written.**

---

## 4. Structural problems

- **Database not reproducible.** The only migration (`prisma/migrations/20251025081105_…`) creates *only* the 7 auth tables. The ~25 business tables exist only in the introspected `schema.prisma`. `prisma migrate deploy` cannot rebuild the schema. *(Biggest maintainability liability.)*
- **Zero tests, zero CI.** No runner, no `.github/` workflows.
- **God-files — 48% of the codebase in 4 files:** `StepSelectAdType.tsx` (3,246), `ads/print/route.ts` (3,191), `advertisements/all/page.tsx` (2,699), `newspapers/AddEditModal.tsx` (2,238).
- **Concurrency bug** in `ads/print/route.ts`: module-level mutable `color_x/color_y` (lines 20-21) written/read across `await` points → wrong PDF coordinates under concurrent requests (Appendix K).
- **Data model:** three overlapping category systems, string "FKs" (`newspaper_name`, `ad_type`), `Timestamp` vs `Timestamptz` mismatch, 30 denormalized pricing columns, missing FK indexes (Appendix L).
- **Quality gates disabled:** `eslint.config.mjs:18` turns off `no-explicit-any` and `prefer-const`; ~115 `any` escapes.
- **No docs:** `README.md` is one line; no CLAUDE.md.

---

## 5. Tech-stack assessment

**The core stack is a good choice; the peripheral library picks are not.**

**Good (keep):** Next.js + React + TypeScript; PostgreSQL + Prisma; Redis sessions; Tailwind + Headless UI; Zod; Cloudinary. These are exactly what you'd pick for this app today — part of why a rewrite is pointless.

**Questionable (clean up):**
- Bleeding-edge versions (Next 16, React 19, `next-auth 5.0.0-beta`) in a payment app — thinner docs, more breakage.
- `next-auth` (beta) installed but unused, alongside a hand-rolled session system — two auth stacks, neither wired up.
- **3 password-hashing libs** (`bcrypt`, `bcryptjs`, `argon2`) used inconsistently → latent login bugs.
- **5 PDF/canvas libs** (`jspdf`, `pdf-lib`, `pdfmake`, `puppeteer`, `canvas`); two unused; `puppeteer` pulls full Chromium.
- Filesystem uploads to `public/` — won't persist on serverless; Cloudinary already in use.
- `axios` + `fetch` both; `crypto` as an npm dep shadows Node's built-in.

**Takeaway:** the fix is *cleanup*, not changing technologies.

---

## 6. Why not rewrite — the core reasoning

| Hard to recreate (the real product) | Easy to fix (the scary-looking part) |
|---|---|
| Pricing rules — first-N-words, extra words, tint, 6-way language combine, boxes, internet, tax (only in `StepSelectAdType.tsx:425-637`) | Auth/RBAC — the correct code already exists in `lib/auth.ts`, just unwired |
| Six publisher PDF layouts with exact print coordinates (`ads/print/route.ts`, 3,191 lines) | Server-side pricing — extract the existing calc into a function |
| Multi-language (Sinhala/Tamil/English) fonts & rendering | Schema hygiene, indexes, dead-code removal |

A rewrite throws away the hard part to redo the easy part — and you'd still have to migrate the un-reproducible live DB. The incremental path is **lower risk and less work**. The only thing making it harder than it should be is the lack of tests, which is why testing comes before any refactor.

---

## 7. Remediation TODO (step-by-step)

Ordered by priority. **Phase 0 ships first** — those issues are live.

### Phase 0 — Stop the bleeding (security)
- [ ] **0.1** Replace the static `admin_auth` cookie with `createSession(user.id)` in `admin/login/route.ts:51`; store the `sessionId`.
- [ ] **0.2** Move `app/admin/middleware.ts` → root `middleware.ts`; validate via `getSession()`.
- [ ] **0.3** Authorize `app/admin/layout.tsx:18` via `requireAdmin()` instead of the cookie string.
- [ ] **0.4** Add `await requireAdmin()` to every admin/mutating route (Appendix A list).
- [ ] **0.5** Stop leaking `password_hash`: explicit `select` in `users/route.ts:5`.
- [ ] **0.6** Make `RoleCheck.tsx` UX-only; remove debug logs (`RoleCheck.tsx:23`, `login/route.ts:63`).
- [ ] **0.7** Payment integrity: require token, ignore body `amount`, verify server-side (`proceed-payment/route.ts`).
- [ ] **0.8** Server-side pricing: add `calculatePrice()`; use it in `submit-ad/route.ts:144`.
- [ ] **0.9** Opaque/random reference numbers; wrap `create` in the retry loop (`submit-ad/route.ts:46-127`).
- [ ] **0.10** Lock down `track/sendLink/route.ts`: require existing token/admin; rate-limit.
- [ ] **0.11** Fix `uploadNewspaperImage`: auth + server-generated filename + containment check + type/size limits (or use Cloudinary).
- [ ] **0.12** Stop returning raw `error.message` to clients (`proceed-payment:41`, `updateStatus:233`, `newspapers/route.ts:267`, `newspapers/[id]:597`, `send-bulk-email:166`).

### Phase 1 — Make it reproducible & safe to change
- [ ] **1.1** `prisma db pull` prod → squashed baseline migration (DB reproducible from repo).
- [ ] **1.2** Add Vitest + a CI workflow (typecheck + lint + test).
- [ ] **1.3** Write tests for the riskiest logic first: pricing, submit-ad, payment, reference generation.
- [ ] **1.4** Replace the 8 `new PrismaClient()` instances with the `lib/prisma` singleton.
- [ ] **1.5** Enforce `zod.safeParse` on request bodies (schemas already exist, unused).
- [ ] **1.6** Run profanity check server-side in `submit-ad` (currently client-only + fails open).

### Phase 2 — Tech-stack cleanup
- [ ] **2.1** One password-hashing lib (recommend argon2id); remove the others; unify call sites.
- [ ] **2.2** One PDF strategy; remove unused `puppeteer`, `pdfmake`, `argon2`, `next-auth`.
- [ ] **2.3** Move uploads to Cloudinary.
- [ ] **2.4** Standardize on `fetch`; drop `axios`; remove `crypto` npm dep.
- [ ] **2.5** Keep exactly one of `next-auth` / hand-rolled `lib/auth.ts`.
- [ ] **2.6** Re-enable `no-explicit-any` + `prefer-const` (`eslint.config.mjs:18`); burn down ~115 `any`.

### Phase 3 — Data model
- [ ] **3.1** Fix `cs_page_full_color_price String?` → `Int?` (`schema.prisma:218`).
- [ ] **3.2** Add missing FK + `created_at` indexes (Appendix L5).
- [ ] **3.3** Consolidate the three category systems to FK-based; drop dead `newspaper_ad_types`/`nw_ad_type_id`.
- [ ] **3.4** Replace string "FKs" `newspaper_name` (:104), `ad_type` (:105) with real relations.
- [ ] **3.5** Standardize `DateTime` → `Timestamptz(6)`, money → `Decimal(12,2)`.
- [ ] **3.6** Normalize the 30 pricing columns into one `pricing` child table.

### Phase 4 — Decompose god-files (after tests from 1.3)
- [ ] **4.1** Delete module-level `color_x/color_y` in `print/route.ts:20-21` → local `{x,y}` (fixes the race).
- [ ] **4.2** Split `print/route.ts` into `lib/pdf/publishers/*` + shared `draw/format/coordinates`.
- [ ] **4.3** `StepSelectAdType.tsx`: extract `usePricing()`, `<ImageUploadField>`, `dateRules.ts`, field components.
- [ ] **4.4** `all/page.tsx`: extract `<AdModal>`, `useAds()`, `buildPrintPayload()`; delete dead code.
- [ ] **4.5** `AddEditModal.tsx`: `newspaperMapper.ts` (one source of truth), `useAdTypes()`, split editor.
- [ ] **4.6** Extract cross-file duplicates: `formatColorType`, `parseStyledText`, `uploadImageToCloudinary` → `lib/`.

### Phase 5 — Documentation
- [ ] **5.1** Real `README.md` (setup, env, run/build).
- [ ] **5.2** `CLAUDE.md` documenting pricing rules, the publisher PDF system, and the domain model.

---

# Appendices — Detailed Evidence

Every item below is verified against the current source.

## Appendix A — API route auth coverage (26 of 28 routes have no auth)

| Route | Auth | Risk |
|---|:---:|---|
| `users/route.ts` | ❌ | GET dumps users + `password_hash`; POST creates SUPER_ADMIN |
| `users/[id]/route.ts` | ❌ | Edit/delete any user, reset passwords |
| `ads/updateStatus/route.ts` | ❌ | Change any ad status/price; trigger SMS |
| `ads/[reference]/proceed-payment/route.ts` | ❌ | Mark paid, arbitrary amount |
| `ads/[reference]/route.ts` (PATCH) | ❌ | Overwrite `print_url`/`is_read` |
| `ads/[reference]/{cancel,confirm,resubmit}` | token | Token-gated (OK), but tokens mintable via sendLink |
| `ads/route.ts` | ❌ | Lists all ads + advertiser PII (name/NIC/phone/address) |
| `ads/pendingAds`, `ads/print`, `ads/send-bulk-email` | ❌ | Admin data / open email relay |
| `newspapers/route.ts`, `newspapers/[id]` | ❌ | Mutate newspapers |
| `ad-types/route.ts`, `ad-types/[newspaper-id]` | ❌ | Mutate config |
| `admin/phone`, `promo`, `subcategories` | ❌ | Mutate admin data |
| `uploadNewspaperImage` | ❌ | Arbitrary file write |
| `submit-ad`, `contact` | public | Intended public (but see price/profanity) |
| `track/*` | token | The one sound pattern (undercut by sendLink) |
| `admin/login`, `admin/logout` | n/a | Set/clear the (broken) cookie |

**Fix pattern:**
```ts
import { requireAdmin } from "@/lib/auth";
export async function GET() {
  try { await requireAdmin(); }
  catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
  // …
}
```

## Appendix K — God-files (structure & decomposition)

**`StepSelectAdType.tsx` (3,246):** 30 `useState`, 0 `useMemo`. Pricing effect `425-637` has a 22-entry dep array and mutates `formData.adText`. Three duplicated image-upload blocks (1373-1525, 2247-2357, 2358-2482). → extract `usePricing()`, `<ImageUploadField>`, `dateRules.ts`, field components.

**`ads/print/route.ts` (3,191):** six per-publisher branches. **Concurrency bug:** module-level `let color_x/color_y` (20-21) written 2260-2270 / 2595-2606, read 2273-2295 / 2608-2629 across `await`. Latent bug: `ad_type.key` always `undefined` (`ad_type` is a string). → delete globals, split into `lib/pdf/publishers/*`.

**`advertisements/all/page.tsx` (2,699):** 33 `useState`; ~1,486-line modal (1213-2699); record state triple-copied (`selectedAd`/`editableAd`/`editedText`); 60s poll races the filter effect; dead `handlePrint2`/`generatePublisherEmail`. → `<AdModal>`, `useAds()`, `buildPrintPayload()`.

**`newspapers/AddEditModal.tsx` (2,238):** 34 `any`; the field mapping is triplicated (135-174, 420-473, 548-613) and already drifts; nested-state mutation antipattern (211-244). → `newspaperMapper.ts`, `useAdTypes()`, split editor.

## Appendix L — Data model remediation

- **L1 — Three category systems:** (a) `ad_type_categories.category` free string (schema:250); (b) `ad_categories`/`ad_sub_categories`/`newspaper_ad_types` (305-391, the structured one; `nw_ad_type_id` is dead); (c) free strings `advertisements.classified_category`/`subcategory` (106-107). Joined by string equality at `ad-types/[newspaper-id]/route.ts:42`. → make (b) authoritative; FK the others to it.
- **L2 — String "FKs":** `advertisements.newspaper_name` (:104) duplicates the `newspaper_serial_no` relation (admin even rebuilds an id from the name string at `all/page.tsx:175-178`); `ad_type` string (:105) duplicates `ad_type_id` (:122). → use the real relations.
- **L3 — Types:** auth tables `Timestamptz(6)`, ads domain `Timestamp(6)` (incl. token expiry :176) — standardize to `Timestamptz`. `cs_page_full_color_price` is `String?` (:218) vs `Int` siblings — typo. Money mixes `Int` and `Decimal` — standardize to `Decimal(12,2)`.
- **L4 — Pricing sprawl:** 8 `cs_*` columns duplicated across `newspapers` (211-218) and `ad_types` (282-289), plus `combine_*`/`internet_*` — ~30 columns. → one `pricing` child table keyed `(owner_type, owner_id, channel, color_option, language_combo)`.
- **L5 — Missing indexes:** `advertisements.created_at` (orderBy, `ads/route.ts:111`), `payment_ads.created_at`, `advertisements.ad_type_id`, and every unindexed FK child (`advertiser_id`, `newspaper_serial_no`, `classified_ads.reference_number`, `payment_ads.reference_number`, `casual_ads.section_id`, `*.user_id`, etc.); `agency.papers` needs a GIN index.

## Appendix M — Money & data flows

- **M1 (Critical):** client-controlled price — `StepSelectAdType.tsx:160-612` → `post-ad/page.tsx:405` → `submit-ad/route.ts:144`. No server-side pricing.
- **M2 (Critical):** `updateStatus` — unauthenticated status + price override + SMS.
- **M3 (Critical):** `proceed-payment` — client amount, no token.
- **M4 (Critical):** sequential/enumerable references + generation race (`submit-ad/route.ts:46-127`).
- **M5 (High):** unauthenticated PATCH (`[reference]/route.ts`), PII dump (`ads/route.ts`), open email relay (`send-bulk-email`).
- **M6 (High):** `sendLink` mints tokens to any email for any reference, unauthenticated.
- **M7 (Medium):** Zod never enforced at runtime (0 `.parse`/`.safeParse`); profanity client-only + fails open (`profanity.ts:10-13`); SMS `to` un-sanitized (`sendSms.ts:23-25`); raw error messages leaked.
- **M8 (Low):** every submission creates a new advertiser row (dedupe commented out, `submit-ad:27-44`); per-route `PrismaClient`; dead branches.

---

## How this was produced

Parallel Claude Code subagents audited the repo along independent axes — code quality, security/correctness, architecture/data-model/tooling, god-file structure, and money/data flows — each gathering `file:line` evidence, cross-checked and synthesized here. To extend any thread, ask Claude to continue the relevant audit.
