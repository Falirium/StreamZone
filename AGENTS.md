## 1. CONTEXT

 You are an expert engineer building an MVP Streaming Platform.
* Look inside `.agents/skills` for all specialized execution tasks.
* You must read and follow the constraints outlined in `PROJECT_PRD.md` before generating code.
---

## 2. STYLE GUIDE

### TypeScript
- use **TypeScript everywhere**
- prefer explicit types on exported functions
- avoid `any`
- create shared DTO/types for API payloads where useful
- validate inputs at boundaries
- keep server and client types cleanly separated when needed

### React / Next.js
- prefer **server components by default**
- use client components only when interactivity is required
- keep route files thin
- move reusable logic to `lib/` or feature modules
- avoid bloated page components

### State Management
- prefer **server state first**
- use local component state for simple UI interactions
- use TanStack Query only where it adds real value
- avoid global state unless clearly necessary
- do not introduce Redux unless explicitly justified

### Tailwind CSS
- use Tailwind utility classes directly
- keep spacing/layout consistent
- prefer reusable UI primitives for repeated patterns
- avoid messy class duplication when a component abstraction is better
- optimize for mobile-first layouts

### UI Style
- clean
- simple
- fast
- mobile-first
- admin UI should prioritize clarity over decoration

### Code Organization
- group code by feature where practical
- keep API/business logic out of presentation components
- keep auth, pricing, redemption, and playback logic on the server side
- create small composable functions instead of giant files

---

## 3. SECURITY RULES

### Secrets
- never hardcode API keys
- never commit secrets to the repo
- use environment variables for all sensitive credentials
- treat playback source credentials, provider refs, and admin secrets as sensitive

### Auth
- admin routes must require authenticated admin sessions
- user access must be validated server-side
- never trust client-side checks for access control
- protect all admin actions with authorization checks
- user login OTP: during MVP testing, use console printed OTP/sandbox master code. For production launch, route OTP delivery/requests via the WhatsApp operator pool (Option C) to save SMS gateway costs.

### Database / Access Control
- validate all writes server-side
- use least-privilege principles
- if Supabase/Postgres RLS is used, write policies carefully and explicitly
- do not bypass RLS casually
- admin-only operations must not be reachable by user-facing sessions

### Tokens / Playback
- never expose raw sensitive source/provider details to the client unless absolutely required
- prefer short-lived or backend-resolved playback access
- do not store long-lived privileged access tokens in the frontend
- rotate/revoke tokens when architecture supports it

### Validation / Abuse Protection
- validate all request payloads
- rate-limit sensitive routes like code redemption and admin auth
- log critical actions such as payment review, code revoke, code reissue, and source changes
- treat payment approval and access creation as auditable actions

---

## 4. PROTOCOL

When building any feature, follow this order exactly:

### Step 1 — Read Context
- read `PROJECT_PRD.md`
- inspect the relevant existing code
- inspect schema, routes, and related components
- do not start coding from assumptions

### Step 2 — Define the Feature Slice
Identify:
- actor involved
- route/screen involved
- table(s) involved
- API/server action involved
- validation rules
- auth requirements

### Step 3 — Check Existing Patterns
Before adding code:
- reuse existing UI patterns
- reuse existing data-access patterns
- reuse existing validation/auth helpers
- avoid introducing a second pattern when one already exists

### Step 4 — Implement Backend First
Build in this order:
1. schema/data changes
2. server logic
3. validation
4. auth/authorization
5. audit logging if needed

### Step 5 — Implement UI Second
Then build:
1. page/screen
2. form/input
3. loading/error/success states
4. mobile responsiveness
5. admin usability

### Step 6 — Verify End-to-End
Check:
- happy path
- invalid input path
- unauthorized path
- empty state
- failure state
- audit/security implications

### Step 7 — Keep Scope Tight
- do only what the feature requires
- do not add unrelated refactors unless necessary
- do not build future roadmap items during MVP work
- document follow-up items instead of expanding scope

### Step 8 — Final Output Standard
When finishing a feature:
- summarize what was built
- list files changed
- mention any migrations/env vars required
- mention any known limitations