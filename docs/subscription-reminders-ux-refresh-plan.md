# Subscription Reminders UX Refresh Plan

## Purpose

Make the superadmin subscription reminder page safe and easy to use for both one-off reminders and automatic renewal communication.

An operator should always understand:

- who will receive the reminder;
- which channel will be used;
- which message will be sent;
- whether the tenant is active, nearly due, or expired;
- whether the send succeeded, failed, or was skipped;
- when the automatic reminder service last ran and what it will do next.

This page handles tenant platform subscriptions. It must contact the tenant account admin selected by the existing billing-recipient rules. It must never expand the audience to all tenant staff or platform superadmins.

## Where We Are Now

The current page already has a useful foundation:

- tenants can be searched and filtered by subscription state;
- expired and due-soon tenants are visible;
- one tenant can be selected for a manual reminder;
- SMS, email, and in-app delivery can be selected;
- unavailable channels are disabled;
- the result of each selected channel is shown after sending;
- automatic reminders run through the scheduled sweep;
- reminder history loads progressively while scrolling;
- the platform SMS wallet is separate from tenant SMS balances.

The main limitations are:

- manual sending supports one tenant at a time;
- there is one global SMS template rather than a template library;
- email and in-app copy cannot be managed from the page;
- automatic milestones and their templates are not visible as a complete workflow;
- editing the current template changes the shared template directly;
- there is no one-off message edit that leaves the saved template unchanged;
- there is no clear automation health, last-run, next-run, or dry-run view.

## Recommended Page Structure

Use one page with four focused workspace tabs beneath a compact health summary:

1. **Manual send**
2. **Automations**
3. **Templates**
4. **Delivery history**

The page header should contain the title, a short description, automation status, and a restrained `Run sweep` command. Wallet figures belong in the health summary, not repeated inside every workflow.

### Health Summary

Show four concise metrics:

- Automation: healthy, delayed, disabled, or failed.
- Next sweep: expected date and time.
- Platform SMS balance: usable master-wallet balance.
- Recent delivery rate: successful deliveries during the selected period.

Also show the last successful sweep and the number of tenants currently expired or due within five days.

Do not show technical queue names, internal IDs, or provider payloads in the main summary.

## Manual Send Experience

The manual workflow should be a clear four-step composer. Keep all four steps on the same page on desktop. On mobile, present them as an ordered vertical flow.

### Step 1: Choose Subscribers

Use a searchable multi-select tenant list.

Each row should show:

- company name and subdomain;
- plan;
- subscription state;
- expiry or renewal date;
- days remaining or days overdue;
- resolved account-admin name;
- available channels;
- a checkbox for selection.

Filters:

- Needs attention: expired plus due within five days.
- Expired.
- Due today.
- Due in 1 day.
- Due in 3 days.
- Due in 5 days.
- Active.
- Trial.
- Missing contact.
- All.

Selection controls:

- Select one tenant.
- Select all visible results.
- Clear selection.
- Selected count shown at all times.

Bulk selection must apply only to the visible filtered result set. Never provide an unqualified `Select every tenant` action.

### Step 2: Choose Channels

Use checkboxes for SMS, email, and in-app notification.

For every channel show:

- number of selected tenants who can receive it;
- number missing the required contact;
- SMS unit estimate where available;
- a clear warning before excluding unavailable recipients.

Suggested summary:

> 12 tenants selected. SMS can reach 10, email can reach 12, and in-app can reach 9.

The operator should be able to continue when one channel is unavailable, but the review step must name what will be skipped.

### Step 3: Choose And Edit Messages

Each selected channel gets its own template selector and editor.

The operator can:

- choose a saved template;
- preview the rendered message using a selected tenant;
- make a one-off edit for this send;
- reset the edit back to the saved template;
- save the edited copy as a new template;
- deliberately update the original template through a separate `Update template` action.

One-off editing must never silently overwrite a saved or automated template.

SMS editor details:

- live character count;
- estimated SMS segment count;
- variable insertion menu;
- warning when copy becomes unusually long;
- phone preview.

Email editor details:

- subject field;
- plain-text body;
- simple formatted preview;
- test-email action.

In-app editor details:

- title;
- short body;
- dashboard notification preview.

Supported variables should be inserted from a menu instead of being manually memorized:

- `{admin_name}`
- `{company_name}`
- `{plan_name}`
- `{days_left}`
- `{expiry_date}`
- `{invoice_number}`
- `{renewal_link}` when a stable authenticated route is available

Unknown variables must block saving. Missing optional values should render cleanly without blank labels or malformed sentences.

### Step 4: Review And Send

The review panel should show:

- selected tenant count;
- count per channel;
- skipped recipients and reasons;
- template name per channel;
- sample rendered message;
- estimated SMS usage;
- whether this is a one-off edit.

Sending to one tenant can use a normal confirmation button. Sending to multiple tenants requires a confirmation dialog that states the exact tenant and delivery counts.

The send button should become disabled while the request is running. The frontend must not automatically retry a manual bulk send because that can create duplicate messages.

### Send Feedback

After processing, show a persistent result panel rather than relying only on a toast.

Summary:

- tenants processed;
- deliveries sent;
- deliveries failed;
- deliveries skipped;
- SMS units used.

Expandable results should show one row per tenant and channel with destination, status, time, and a human-readable failure reason.

Actions:

- Retry failed only.
- View in delivery history.
- Start another reminder.

Retry must create a deliberate new attempt and must not resend successful channels.

## Automation Experience

The automation tab should make the scheduled behaviour understandable without exposing Celery internals.

### Automation Header

Show:

- enabled or disabled state;
- last started time;
- last completed time;
- last result;
- next expected run;
- tenants evaluated;
- sent, skipped, and failed counts.

Controls:

- Enable or disable automation.
- Run sweep now.
- Preview next sweep.

`Preview next sweep` must be a dry run. It should list the tenants, milestones, channels, and templates that would be used without creating deliveries.

### Milestone Rules

Represent automatic reminders as ordered rules rather than one hidden setting:

- 5 days before renewal.
- 3 days before renewal.
- 1 day before renewal.
- Due today, optional.
- Expired notice, sent once per billing period.

Each rule should have:

- enabled toggle;
- timing;
- channels;
- template per channel;
- recipient policy, fixed to tenant account admin;
- last-used count;
- preview action.

Rules should be reorderable only if order affects evaluation. Otherwise keep chronological order fixed to avoid unnecessary complexity.

### Automation Safety Rules

- Do not send when the billing cycle or invoice is paid, voided, cancelled, written off, or has no balance.
- Stop reminders immediately after early renewal is reconciled.
- Deduplicate by billing cycle, milestone, channel, and recipient.
- Send one expired notice per billing period unless an operator deliberately sends a manual reminder.
- Never use tenant SMS balances for platform subscription reminders.
- Resolve only one approved tenant account admin.
- Record why a delivery was skipped.
- A failure on one channel must not prevent other selected channels from running.

## Template Library

Templates need their own workspace rather than a single text area.

### Template List

Provide search and filters for:

- channel;
- manual or automated use;
- milestone;
- active or archived state.

Each template row should show name, channel, automation use, last updated date, and whether it is currently assigned to a rule.

### Template Editor

Required fields:

- template name;
- channel;
- subject for email or in-app;
- message body;
- available variables;
- status;
- intended use: manual, automatic, or both.

Actions:

- Save draft.
- Publish.
- Duplicate.
- Archive.
- Preview.
- Send test.
- View version history.

An assigned automated template should not be deleted. Archive it after another template has been assigned.

### Starter Templates

Provide editable starting templates for:

- Renewal in 5 days.
- Renewal in 3 days.
- Renewal tomorrow.
- Due today.
- Subscription expired.
- General manual reminder.

Use direct, human copy. Avoid amounts unless invoice reconciliation is guaranteed for that message.

## Delivery History

Keep infinite loading, then add filters for:

- tenant;
- manual or automatic;
- channel;
- milestone;
- sent, failed, skipped, or pending;
- date range.

Every row should show:

- company;
- recipient;
- channel;
- reminder type;
- status;
- sent time;
- concise error when applicable.

Opening a row should show the rendered content, template version, billing cycle, provider reference, and attempt history. Sensitive provider credentials or raw callback payloads must never be exposed.

## Required Backend Evolution

The current singleton SMS template cannot support this complete UX. Introduce these contracts without breaking the existing scheduled sweep.

### Template Record

Suggested fields:

- `id`
- `name`
- `channel`
- `subject`
- `body`
- `usage_type`
- `milestone`
- `is_active`
- `version`
- `created_by`
- `created_at`
- `updated_at`

### Automation Rule

Suggested fields:

- `id`
- `milestone_type`
- `days_before`
- `enabled`
- `channels`
- `template_ids_by_channel`
- `send_once_per_period`
- `updated_by`

### Manual Campaign

A manual bulk send should create a campaign with:

- selected tenant IDs;
- selected channels;
- saved template IDs;
- snapshotted rendered content;
- creator;
- status and counts;
- created and completed times.

Deliveries remain the per-recipient, per-channel source of truth.

### Suggested API Surface

- `GET /superadmin/subscription-reminders/recipients/`
- `POST /superadmin/subscription-reminders/manual/preview/`
- `POST /superadmin/subscription-reminders/manual/send/`
- `POST /superadmin/subscription-reminders/manual/retry-failed/`
- `GET/POST /superadmin/subscription-reminders/templates/`
- `GET/PATCH /superadmin/subscription-reminders/templates/{id}/`
- `POST /superadmin/subscription-reminders/templates/{id}/test/`
- `GET/PATCH /superadmin/subscription-reminders/automation/`
- `POST /superadmin/subscription-reminders/automation/preview/`
- `POST /superadmin/subscription-reminders/automation/run/`
- `GET /superadmin/subscription-reminders/runs/`
- `GET /superadmin/subscription-reminders/logs/`

For backward compatibility, the existing single-template endpoint can temporarily map to the default SMS template.

## Responsive And Accessibility Requirements

- Desktop: tenant selector on the left, composer and review on the right.
- Mobile: ordered vertical steps with a sticky selected-count and send summary.
- All selectors must be keyboard accessible.
- Status must use text and icons, not colour alone.
- Focus should move to the result summary after sending.
- Confirmation dialogs must state the real recipient and channel counts.
- Loading states must preserve layout dimensions.

## Recommended Delivery Order

1. Preserve the current safe recipient resolver and delivery logging.
2. Add multi-select recipients and a preview endpoint.
3. Add one-off per-channel message editing.
4. Add the template library and migrate the singleton SMS template.
5. Add configurable automation rules and run health.
6. Add campaign-level results and retry-failed-only behaviour.
7. Expand delivery-history filters and detail views.

## Acceptance Checklist

- Expired tenants are easy to find.
- One or many tenants can be selected safely.
- The selected audience is visible before sending.
- Only the approved tenant account admin is contacted.
- SMS, email, and in-app channels can use different templates.
- A one-off edit does not overwrite a saved template.
- Automated templates can be edited and previewed per milestone.
- Paid or renewed tenants are excluded before delivery.
- Duplicate automatic reminders are prevented.
- A bulk result identifies every failed or skipped delivery.
- Failed-only retry never repeats a successful delivery.
- The page clearly shows whether automation is healthy.

