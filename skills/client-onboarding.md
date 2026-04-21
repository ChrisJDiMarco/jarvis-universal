# Skill: Client Onboarding

## Trigger
"onboard [client name]", "new client", "set up [client name]", "deploy for [client]"

## Goal
Execute the full onboarding workflow for a new agency client in under 30 minutes.

## Process

### Phase 1: Database Setup (2 min)
1. Update agency_clients table: set stage = 'onboarding', onboarded_date = today
2. Log deployment fee to revenue table
3. Log first month's recurring to revenue table
4. Update `memory/agency.md` with new client count and MRR

### Phase 2: GHL Sub-Account (10 min)
1. Clone master GHL sub-account template
2. Update business name, phone number, timezone
3. Configure calendar integration (booking link)
4. Set up pipeline stages: New Lead → Contacted → Qualified → Booked → No Show → Won → Lost
5. Import client's existing contacts if provided (CSV)

### Phase 3: n8n Workflow Deployment (10 min)
1. Duplicate master "Speed to Lead" workflow template
2. Configure webhook URL for client's lead source (Facebook Ads, Google Ads, website form)
3. Update SMS/email templates with client business name and tone
4. Set follow-up timing: 60s → 10min → 1hr → 4hr → 24hr → 48hr → 72hr
5. Configure booking link in messages
6. Set no-show recovery sequence: 30min post-missed → 24hr → 72hr
7. Activate workflow

### Phase 4: Testing (5 min)
1. Submit test lead through client's form/ad
2. Verify SMS fires within 60 seconds
3. Verify follow-up sequence triggers correctly
4. Test booking flow end-to-end
5. Test no-show recovery trigger
6. Verify GHL pipeline updates on each event

### Phase 5: Handoff (3 min)
1. Send client welcome email with:
   - What's now automated
   - What to expect (lead notifications, booking confirmations)
   - How to reach support
   - Link to their GHL dashboard (if applicable)
2. Save handoff doc to `owners-inbox/onboarding/[client]-handoff.md`
3. Update agency_clients stage to 'active'
4. Log completion to system_logs

## Rules
- NEVER skip testing phase — a broken automation on day 1 kills trust
- If any test fails, fix before activating
- Always save the client's specific workflow configuration for replication
- Update memory/agency.md with new active client count

## Reference Files
- GHL template sub-account ID: (set after first setup)
- n8n master workflow ID: (set after first setup)
- Welcome email template: assets/templates/client-welcome.md
