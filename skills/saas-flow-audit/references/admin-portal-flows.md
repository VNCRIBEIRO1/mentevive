# Admin & Portal Flow Checklist

## Admin Routes (/admin/*)

### Auth Requirement
All admin routes require `requireAdmin()` which returns `{ userId, tenantId, role }`.
Role must be `admin` or `therapist`.

### Route Checklist

#### /admin (Dashboard)
- [ ] Shows tenant-scoped stats (patients count, appointments today, revenue)
- [ ] No cross-tenant data leakage
- [ ] Handles empty state (new tenant, no data)

#### /admin/pacientes
- [ ] List: filtered by tenantId
- [ ] Create: assigns tenantId automatically
- [ ] Edit: verifies patient belongs to tenant
- [ ] Delete/archive: same tenant check
- [ ] Search: scoped to tenant

#### /admin/agenda
- [ ] Shows only current tenant's appointments
- [ ] Create appointment: validates patient + therapist belong to tenant
- [ ] Cancel: updates status, notifies patient
- [ ] Reschedule: validates availability

#### /admin/financeiro
- [ ] Lists payments for current tenant only
- [ ] Shows Stripe Connect status
- [ ] Revenue calculations scoped to tenant

#### /admin/prontuarios
- [ ] Clinical records: patient must belong to tenant
- [ ] Create/edit: assigns tenantId
- [ ] View: verifies therapist has access

#### /admin/horarios
- [ ] Availability slots: per therapist in tenant
- [ ] Blocked dates: scoped to tenant
- [ ] No overlap validation

#### /admin/sala-espera
- [ ] Lists waiting room entries for today's appointments
- [ ] Jitsi room names include tenantId for isolation
- [ ] Patient can join only their appointment room

#### /admin/assinatura
- [ ] Shows current plan and trial status
- [ ] CDKey input field + redemption button
- [ ] Shows trial expiration date
- [ ] Upgrade prompts when on free/starter
- [ ] History of plan changes

#### /admin/configuracoes
- [ ] Stripe Connect onboarding button
- [ ] Profile settings (name, CRP, specialties)
- [ ] Notification preferences
- [ ] All settings scoped to tenant

#### /admin/blog
- [ ] Blog posts: CRUD scoped to tenant
- [ ] Published/draft status per post
- [ ] Slug generation unique within tenant

#### /admin/grupos
- [ ] Group therapy management: scoped to tenant
- [ ] Members: patients from same tenant only

## Super Admin Routes (/super/*)

### Auth Requirement
All super routes require `requireSuperAdmin()` — `isSuperAdmin === true`.

#### /super (Dashboard)
- [ ] Platform-wide metrics (total tenants, total users, revenue)
- [ ] NOT tenant-scoped — shows everything

#### /super/tenants
- [ ] List all tenants with plan, status, created date
- [ ] Edit tenant: change plan, status, extend trial
- [ ] Suspend/activate tenant

#### /super/cdkeys
- [ ] Generate batch of CDKeys (plan, quantity, duration)
- [ ] List all CDKeys with redemption status
- [ ] Filter: available, redeemed, by plan
- [ ] Stats: total generated, redeemed, available

## Portal Routes (/portal/*)

### Auth Requirement
All portal routes require `requireAuth()` — user must be authenticated with active tenantId.
Patient must have membership in current tenant.

#### /portal (Dashboard)
- [ ] Shows upcoming appointments for patient in current tenant
- [ ] Quick actions: book, view documents, triagem

#### /portal/sessoes
- [ ] Past and future sessions for patient
- [ ] Scoped to current tenant only

#### /portal/pagamentos
- [ ] Payment history for patient in tenant
- [ ] Payment status (paid, pending, overdue)

#### /portal/documentos
- [ ] Shared documents from therapist to patient
- [ ] Download/view access

#### /portal/triagem
- [ ] Intake forms assigned by therapist
- [ ] Submission saves to tenant-scoped record

#### /portal/agendar
- [ ] Book appointment with tenant's therapist
- [ ] Shows available slots from /admin/horarios
- [ ] Creates appointment scoped to tenant

#### /portal/sala-espera
- [ ] Join Jitsi room for scheduled appointment
- [ ] Validates appointment exists and belongs to patient + tenant
