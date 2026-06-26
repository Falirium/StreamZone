## 1. STACK
- Frontend: Next.js + TypeScript + Tailwind
- Backend: Next.js API / Node.js
- Database: PostgreSQL + Prisma
- Storage: S3-compatible storage
- Auth:
- Admin: secure login
- User: phone number + code/session
- PWA: yes
- Video layer: backend-managed playback source mapping

## 2. ACTORS
- User: pays, redeems code, watches
- Admin: manages prices, payments, codes, events, support
- Reseller: future, not MVP

## 3. CORE SYSTEM FLOWS
1. User sees offer and pricing
2. User pays using country flow
3. Admin verifies payment
4. Admin sends/assigns code
5. User redeems code
6. System unlocks access
7. User watches on mobile or TV-compatible flow

## 4. IN-SCOPE FEATURES

### Tables
- users
- customer_profiles
- admins
- countries
- plans
- events
- prices
- payments
- access_codes
- redemptions
- access_entitlements
- playback_sources
- support_cases
- audit_logs

### User-facing routes
- GET /pricing
- GET /events
- POST /payments/intake
- POST /redeem-code
- GET /my-access
- GET /watch/:slug
- GET /tv-help

### Admin routes
- POST /admin/login
- GET /admin/dashboard
- CRUD /admin/countries
- CRUD /admin/plans
- CRUD /admin/events
- CRUD /admin/prices
- GET + review /admin/payments
- GET + create + revoke /admin/codes
- GET /admin/customers
- CRUD /admin/playback-sources
- CRUD /admin/support-cases
- GET /admin/audit-logs

### Screens
#### Public
- Home
- Pricing
- Events
- Event Detail
- Payment Instructions
- Redeem Code
- My Access
- Watch Page
- TV Help
- Help

#### Admin
- Login
- Dashboard
- Countries
- Plans
- Events
- Prices
- Payments
- Codes
- Customers
- Playback Sources
- Support
- Audit Logs

## 5. OUT-OF-SCOPE
- Native iOS app
- Native Android app
- Smart TV apps
- Reseller dashboard
- Full payment automation for all countries
- Advanced analytics
- Referral system
- Community/social features
- Complex anti-fraud system
- Multi-tenant/white-label architecture