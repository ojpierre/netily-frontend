# Netily Documentation

> **How to use this guide:** Each section covers one page in the Netily dashboard. Use the table of contents to jump to what you need. Every section explains what you'll see, what you can do, and answers the questions that come up most often.

---

## Table of Contents

1. [Quickstart](#quickstart)
2. [Dashboard](#dashboard)
3. [Users](#users)
4. [Staff Management](#staff-management)
5. [Plans Management](#plans-management)
6. [Routers Management](#routers-management)
7. [IPv4 Networks](#ipv4-networks)
8. [Fair Usage Policy (FUP)](#fair-usage-policy-fup)
9. [Invoice Management](#invoice-management)
10. [Payments](#payments)
11. [Vouchers](#vouchers)
12. [Payment Methods](#payment-methods)
13. [Support Tickets](#support-tickets)
14. [Leads Management](#leads-management)
15. [Loyalty Program](#loyalty-program)
16. [Captive Portal Ads](#captive-portal-ads)
17. [SMS Management](#sms-management)
18. [Community Board](#community-board)
19. [What's New](#whats-new)
20. [Settings](#settings)

---

## Quickstart

This is the fastest path from interest to a working Netily tenant dashboard.

### 1. Submit the registration request

Go to `https://www.netily.co.ke/#contact` and fill in the contact form with your ISP details. This is the official registration pattern: you submit your details, Netily reviews the request, creates your tenant account, and sends the login details to your email.

### 2. Check your email for access details

After Netily registers your account, you will receive your dashboard details by email. Use those credentials to log in to your tenant dashboard.

### 3. Open your dashboard

Your dashboard is where you manage customers, routers, plans, payments, support tickets, leads, SMS, inventory, and billing activity. Start with the Dashboard page to see your current system health and setup status.

### 4. Connect your first MikroTik router

Open Routers Management, add your MikroTik router, and follow the setup instructions shown in the dashboard. Once connected, Netily can monitor router status and help you manage PPPoE and Hotspot services.

### 5. Add plans and customers

Create your plans, then add PPPoE customers or Hotspot services depending on how your ISP bills users. Use the Users and Plans sections of this guide when you need field-by-field help.

### 6. Configure payments and communication

Set up payment methods, SMS settings, and notification preferences so customers receive the right messages and your billing flow stays organized.

### 7. Ask the docs assistant

Use the Netily Support assistant on this docs page or inside your tenant dashboard for onboarding questions. It answers from this documentation only, so it stays focused on Netily usage and avoids exposing internal architecture or sensitive system details.

---

## Dashboard

The Dashboard is your home base. It gives you a live snapshot of your entire ISP operation — network health, revenue, active users, and anything that needs your attention right now.

### What You See

#### Greeting Card (Top)

The first thing you see when you log in. It shows:

- A greeting based on the time of day
- Your current operational shift
- How many routers are online right now
- Urgent alerts — offline routers, low SMS credit, open support tickets, expired subscriptions

Check this first every time you open the system.

#### Key Metrics (4 Cards)

| Card | What It Shows |
|------|--------------|
| Total Customers | All PPPoE and Static users in the system |
| Active Subscriptions | Currently active PPPoE and Hotspot subscribers |
| Expired | Customers whose subscriptions have lapsed |
| Online / Active | Real-time ratio of connected users vs total active subscribers |

> **Tip:** Click the **Expired** or **Online / Active** cards to jump straight to the relevant section of the Users page.

#### Network & Revenue Section

**Router Fleet** shows all your routers with color-coded status:
- 🟢 **Online** — working normally
- 🔴 **Offline** — needs attention
- 🟡 **Flagged** — warning or under maintenance

**Revenue Snapshot** shows:
- Today's revenue with a trend indicator
- This week's revenue
- This month's revenue
- Number of transactions today

**Support Tickets** gives a quick count of Open, In Progress, and Resolved tickets, plus your average response time.

#### Charts

**Weekly Income Chart** — toggle between This Week and Last Week to compare daily revenue.

**Monthly Earnings Chart** — toggle between Current Year and Previous Year to spot seasonal patterns.

#### Quick Actions

One-click shortcuts to the pages you visit most:
- Manage Users
- Manage Routers
- View Payments
- Support Tickets
- Manage Plans
- Invoices

> **Note:** The actions you see depend on your staff role and permissions.

#### Recent Activity Feed

A live audit log showing who did what and when. Click **View all activity** for the full history.

### Auto-Refresh

The Dashboard refreshes automatically every 60 seconds. Use the manual refresh button (top-right) if you need data right now.

### Navigation Shortcuts

| Click on... | Goes to... |
|-------------|-----------|
| Expired card | Users page (filtered by expired) |
| Online/Active card | Users page (online sessions tab) |
| Router Fleet card | Routers management |
| Revenue card | Payments page |
| Support Tickets card | Tickets management |
| Any Quick Action button | That management page |

### FAQ

**Why isn't my dashboard loading?**
Check your internet connection. The dashboard pulls real-time data from the server.

**The data looks outdated.**
The dashboard refreshes every minute. Click the Refresh button for an immediate update.

**What does "Online / Active" mean?**
The first number is users currently connected. The second is total active subscribers. The progress bar shows the percentage who are online right now.

**Can I customize the layout?**
The layout is fixed, but Quick Actions adapt to your staff role.

---

## Users

The Users page is where you manage all your customers — creating accounts, handling subscriptions, and controlling network access.

### Stats Bar

Click any stat to filter the table:

| Stat | What It Shows |
|------|--------------|
| Total | All customers in the system |
| Online | Users currently connected |
| Active | Users with active subscriptions |
| Pending | Users awaiting activation |
| Suspended | Temporarily blocked users |
| Expired | Users with expired subscriptions |
| Hotspot Subs | Active hotspot WiFi users |

### Main Tabs

#### All PPPoE/Static
Your main customer list. Shows name, phone, connection type, status, plan, data usage, and expiry date.

Filters available: status dropdown and search bar (searches by name, phone, username, IP, or billing account).

#### Online Now
Real-time view of who is currently connected. Shows connection duration and data usage. Search by name, IP, or MAC address.

#### Active Subs
Users with active or pending subscriptions. Good for spotting who needs renewal soon.

Color-coded time remaining:
- 🟢 More than 3 days left
- 🟡 1–3 days left
- 🔴 Less than 1 day left

#### Hotspot
Manage hotspot WiFi clients — active and expired sessions, extend sessions, send access codes via SMS.

### User Actions

Click the **⋮ menu** on any user:

| Action | What It Does |
|--------|-------------|
| View Details | Full user profile |
| Edit User | Update name, email, phone, location |
| Extend Subscription | Add time or set a new expiry date |
| Change Plan | Switch the user to a different plan |
| Edit IP Address | Change static IP (PPPoE/Static only) |
| Send SMS | Send payment reminders or login credentials |
| Activate Now | Start subscription timer for pending users |
| Toggle Access | Enable or disable network access |
| Disconnect | Force user offline (only for online users) |
| Delete User | Permanently remove the user |

### Adding a User

**Step 1 — Personal Info**
- First name and last name (required)
- Phone number (required — used as username)
- Email (optional)
- Location (optional)
- Portal password (required)

**Step 2 — Connection Details**
- Connection type: PPPoE or Static IP
- Plan: choose from available plans
- Static IP: pick from the available pool or leave blank to auto-assign

**Step 3 — Activation**

| Option | What Happens |
|--------|-------------|
| Activate Now | Subscription starts immediately |
| 1hr Testing | Creates as pending, auto-activates after 1 hour |
| Save Pending | Creates as pending, you activate manually later |

> **Tip:** If you choose Activate Now, you can record an initial payment at the same time.

### Extending a Subscription

**Option 1 — Add Duration**
Add minutes, hours, or days. Quick buttons: +1 Hour, +1 Day, +7 Days, +30 Days. You can also change the plan at this step.

**Option 2 — Set Specific Date**
Pick an exact expiry date and time. A preview shows when the subscription will end.

### Sending an SMS

Choose from quick templates:
1. Payment reminder with Paybill number
2. Customer portal login credentials

Available variables you can use in your message:

| Variable | Replaced With |
|----------|--------------|
| `{firstname}` | Customer's first name |
| `{package}` | Plan name |
| `{expiry}` | Expiry date |
| `{paybill}` | Paybill number |
| `{account}` | Billing account |
| `{amount}` | Plan price |

A preview shows exactly how the message will look before you send it.

### Bulk Actions

Select multiple users to send bulk SMS or delete multiple users at once.

> ⚠️ Bulk deletion is permanent.

### User Detail Drawer

Click **View Details** on any user to open a panel with:

**General Tab:** personal info, connection details (router, IP, MAC, speeds), subscription info, billing account number, network credentials, and data usage.

**Payments Tab:** full payment history, total paid, and transaction list.

### FAQ

**What's the difference between Active and Online?**
Active means the user has a valid subscription. Online means they're currently connected. A user can be active but not connected.

**How do I assign a static IP?**
The IP pool comes from the selected plan. When adding or editing a user, available IPs from that plan's pool will appear.

**What happens when a subscription expires?**
Network access is automatically blocked and the user gets an expiry notification SMS (if enabled).

**What does Toggle Access do?**
It temporarily blocks or restores network access without deleting the account — useful for non-payment situations or troubleshooting.

**What's the difference between Extend and Change Plan?**
Extend keeps the same plan and adds more time. Change Plan switches to a different plan, updating speeds and price automatically.

---

## Staff Management

Manage your team — add new staff, assign roles, and control who can access the admin dashboard.

### Stats Bar

| Stat | What It Shows |
|------|--------------|
| Total Staff | All team members |
| Staff | General office/support staff |
| Technicians | Field technicians |
| Accountants | Finance and billing staff |
| Support | Customer support agents |

### Staff Roles

| Role | What They Can Do |
|------|-----------------|
| Staff | General office and admin tasks |
| Technician | Field installations and maintenance |
| Accountant | Finance, billing, and payment handling |
| Support | Customer support and helpdesk |

### Adding a Staff Member

Click **Add Staff Member**.

**Required fields:**

| Field | Notes |
|-------|-------|
| First Name | — |
| Last Name | — |
| Email | Used for login |
| Phone Number | Used for SMS notifications |
| Role | Staff / Technician / Accountant / Support |
| Password | 8+ characters with uppercase, lowercase, and a number |

**Optional fields:** ID Number, Gender, Date of Birth.

### Editing a Staff Member

Click **⋮ → Edit** to update email, role, or password. Leave the password field blank to keep the current one.

### Staff Actions

| Action | What It Does |
|--------|-------------|
| Edit | Update role, email, or password |
| Deactivate | Block login temporarily (can be reactivated) |
| Reactivate | Restore access to a deactivated account |
| Delete Permanently | Remove the account — cannot be undone |

### FAQ

**What's the difference between Deactivate and Delete?**
Deactivate blocks login but keeps the account intact — you can reactivate anytime. Delete permanently removes the account with no recovery.

**Can a staff member have multiple roles?**
No. Each staff member has one role. Choose the one that best matches their main responsibilities.

**What happens when I deactivate a staff member?**
They can't log in, but their account and all associated data remain. Reactivate them whenever you need to restore access.

**Who can permanently delete staff accounts?**
Only super administrators. Regular admins can deactivate and reactivate.

**Do staff members need to verify their email?**
No. Accounts are active immediately upon creation.

**What happens to data created by a deleted staff member?**
The account is removed, but all records they created (customers, invoices, etc.) remain intact with their name attached.

---

## Plans Management

Create and manage your service packages — both PPPoE (Fiber/DSL) and Hotspot (WiFi) plans.

### Stats Bar

| Stat | What It Shows |
|------|--------------|
| All Plans | Total plans in the system |
| Hotspot | WiFi hotspot packages |
| PPPoE | Fiber/DSL packages |

### Plan Types

| Type | Description | Used For |
|------|-------------|----------|
| Hotspot | Time or data-based WiFi packages | Pay-as-you-go WiFi customers |
| PPPoE | Monthly subscription plans | Fiber/DSL customers with PPPoE credentials |

### Creating a PPPoE Plan

**Required fields:**
- Plan Name (e.g., "Home Basic 20Mbps")
- Price (KES)
- Validity — duration of the plan
- Unit — Minutes, Hours, Days, Months, or Unlimited

**Optional fields:**
- IP Pool Range — defines the subnet for customers on this plan
- Download/Upload Speed (Mbps)
- Priority — 1 (highest) to 8 (lowest) for MikroTik QoS
- Enable Burst — temporary speed boost settings

**How IP Pool Range works:**
When you enter a subnet (e.g., `172.16.3.1/24`), the system automatically creates an IP pool. Every customer on this plan gets an IP from that pool.

### Creating a Hotspot Plan

**Quick Create Presets** — one-click plans with pre-filled settings:

| Duration | Price |
|----------|-------|
| 30 Minutes | KES 20 |
| 1 Hour | KES 30 |
| 3 Hours | KES 70 |
| 24 Hours | KES 150 |
| 7 Days | KES 500 |
| 30 Days | KES 1,500 |

**Custom Hotspot Plan — required fields:**
- Plan Name (e.g., "Weekend Special")
- Validity — Minutes, Hours, Days, or Unlimited
- Price (KES)
- Download/Upload Speed (Mbps)

**Optional:** Max Devices, Data Limit (unlimited or capped in MB/GB), Description and Features.

> **Important:** You must select a router before creating hotspot plans. Plans are linked to specific routers.

### Editing a Plan

Click **⋮ → Edit Plan** on any plan card. You can update name, type, description, pricing, speeds, validity, data limit, QoS priority, burst settings, FUP settings, active/inactive status, the Popular badge, and the features list.

> **Note for hotspot plans:** Editing a hotspot plan pushes the changes to the router. Changes apply to new sessions only — existing sessions keep their original settings.

### Plan Actions

| Action | What It Does |
|--------|-------------|
| View Details | See complete plan information |
| Edit Plan | Modify settings |
| Deactivate/Activate | Toggle whether new customers can subscribe |
| Delete Plan | Permanently remove the plan |

> **Note:** You can't delete a plan that has active subscribers. Move subscribers to another plan first.

### FAQ

**What's the difference between PPPoE and Hotspot plans?**
PPPoE plans are for customers with dedicated connections (Fiber/DSL). Hotspot plans are for pay-as-you-go WiFi users.

**What does Priority do in a PPPoE plan?**
It controls bandwidth allocation on MikroTik routers. Priority 1 gets processed first, priority 8 last.

**What does Enable Burst do?**
Allows temporary speed above the plan's normal limit — useful for quick downloads and page loads.

**What happens if I deactivate a plan?**
Existing subscribers keep their service. New customers just can't subscribe to it.

**How do I mark a plan as Popular?**
Toggle the Popular switch when editing the plan. It adds a badge to the plan card.

---

## Routers Management

Add and manage all your network devices — monitor status, manage users, and configure hotspot, firewall, and bandwidth settings.

### Stats Bar

| Stat | What It Shows |
|------|--------------|
| Total Routers | All routers in your network |
| Online | Routers currently connected |
| Offline | Routers that are down |
| Avg Uptime | Average uptime across all routers |
| Below SLA | Routers not meeting their SLA target |

### Views

**Grid View** — router cards showing name, IP, status, location, connected users, uptime %, CPU/memory usage, SLA progress, and tags.

**Table View** — detailed table with the same info plus quick action menus.

### Adding a Router

Click **Add Router**. The only required field is the Router Name (e.g., "Main Gateway, Westlands Branch"). Optional: Router Type (MikroTik, Cisco, Ubiquiti, or Other), Location, and Notes.

> **Tip:** After adding, edit the router to configure connection details and get the authentication script.

### Router Actions

| Action | What It Does |
|--------|-------------|
| View Details | Opens the full router management page |
| Edit | View router configuration |
| Test Connection | Check if the router is reachable |
| Reboot | Send a reboot command |
| Delete | Permanently remove the router |

### Router Detail Page

Click any router to open its full management page. It has 16 tabs:

#### 1. Live Status
Real-time info: online/offline status, router identity, model, firmware version, uptime, CPU usage, memory usage, and system details.

#### 2. Overview
Router info (IP, MAC, API port, type, model, firmware), location, and tags.

Quick actions:
- **Sync Users** — update user counts from the router
- **Create Backup** — save router configuration
- **Enter/Exit Maintenance** — put the router in maintenance mode
- **Delete Router** — remove permanently

#### 3. Users
**Hotspot Users:** Active sessions (username, IP, MAC, data usage, uptime), all hotspot users with enable/disable controls, and option to add a new hotspot user.

**PPPoE Users:** Active sessions (username, service, IP, uptime), all PPPoE users with enable/disable controls, and option to add a new PPPoE user.

#### 4. Firewall
View and manage firewall filter rules. Add rules by specifying:
- Chain: input, forward, or output
- Action: accept, drop, or reject
- Source/Destination address (optional)
- Protocol: TCP, UDP, ICMP, or any
- Destination port (optional)
- Comment

#### 5. Queues
Bandwidth management — view all queues, add new queues for rate limiting, enable/disable queues.

When adding a queue:
- Name (e.g., "customer-001")
- Target IP or subnet (e.g., "192.168.88.50/32")
- Max Limit for upload/download (e.g., "10M/10M")
- Burst Limit (optional)
- Priority: 1 (highest) to 8 (lowest)

#### 6. Interfaces
View all interfaces (Ethernet, Bridge, VLAN, PPPoE) with traffic stats. Enable/disable interfaces and manage hotspot bridge ports.

#### 7. Wireless
Monitor wireless interfaces — SSID, band, frequency, connected clients, signal strength, and speeds.

#### 8. Hotspot IP Config
Configure the hotspot network IP:
- Base IP — gateway IP for the hotspot network (e.g., 172.12.0.1)
- Subnet Mask — CIDR prefix (/16 = ~65K hosts, /24 = 254 hosts)

When you save, the system updates: IP pool, bridge IP, DHCP network, hotspot profile address, and clears DHCP leases. Connected devices reconnect within ~3 seconds.

#### 9. Port Manager
Control which physical ports are part of the hotspot bridge:

1. **Scan** — discover all interfaces on the router
2. **Set WAN** — identify your internet connection port
3. **Pick Ports** — toggle which ports join the hotspot bridge
4. **Save** — apply the configuration

> **Note:** The WAN port is locked to protect your internet uplink.

#### 10. Captive Portal
Customize the WiFi login page:
- **Template** — 12 visual themes (Classic, Dark, Gradient, Minimal, and more)
- **Plan Layout** — Default, Grid, or List
- **Hotspot Name** — heading shown on the portal
- **Support Phone** — shown on the portal for customer support
- **Announcement Banner** — optional message above plan cards
- **Logo** — upload your ISP logo
- **Live Preview** — see exactly how it looks before applying

#### 11. Logs
View router system logs. Filter by search query and adjust how many lines to show (25, 50, 100, or 200).

#### 12. Cloud Controller
VPN tunnel management.

**VPN Status:** provisioned/not provisioned, tunnel up/down, VPN IP, traffic stats, certificate expiry.

**Actions:** Refresh Status, Provision VPN, Re-provision VPN.

**Remote Access:** Winbox address and API address for connecting remotely.

**Provisioning Script:** Magic Link one-liner command for MikroTik terminal. Copy and paste it into your router.

#### 13. Scripts
Manage router scripts — the Authentication Script (netily-auth) that registers your router, plus any custom scripts you create.

#### 14. Events
History of all router events — Up, Down, Reboot, Config Change, Warning, etc. — with timestamps.

#### 15. Backups
Create and manage configuration backups. Download backups at any time.

#### 16. Configuration (Read-Only)
View current router settings: name, type, IP, API port, credentials, model, SLA target, location, and notes.

### FAQ

**What's the difference between Online and Offline?**
Online means the router is reachable via VPN and responding to API calls. Offline means it can't be reached.

**What is the authentication script?**
A one-liner command you paste into the MikroTik terminal. It registers your router with the cloud controller, sets up the VPN tunnel, and configures hotspot/PPPoE services.

**What does Port Manager do?**
Lets you choose which physical ports are part of the hotspot network. Ports not in the bridge are isolated.

**What happens when I change the hotspot IP address?**
The system updates the IP pool, bridge IP, DHCP network, and hotspot profile. Connected devices briefly lose connection and reconnect with new IPs within a few seconds.

**What's the difference between Provision and Re-provision VPN?**
Provision sets up the VPN for the first time. Re-provision regenerates certificates and reconfigures the tunnel — use this if certificates expire or the tunnel breaks.

**Can I delete a router that has active users?**
Yes, but those users lose service immediately. Consider scheduling maintenance or disconnecting users first.

---

## IPv4 Networks

Manage all your IP address pools. This page works hand-in-hand with Plans — when you create a plan, you link it to an IP pool here.

### Stats Bar

| Stat | What It Shows |
|------|--------------|
| IP Pools | Total pools in your system |
| Active Pools | Pools available for use |
| Total IPs | All IP addresses across every pool |
| Available IPs | Unassigned IPs ready for customers |
| Plans Linked | How many plans have a pool assigned |
| Utilization | Overall IP usage across all pools |

> **Tip:** Click Available IPs or Plans Linked to jump to the relevant subtab.

### Subtabs

#### IP Pools (Main View)

Your full pool inventory. Each pool shows:
- Pool Name
- Type badge (PPPoE, Static, Hotspot, or DHCP)
- CIDR notation (e.g., 10.50.3.0/24)
- Start and end IP
- Available / Total IPs (e.g., 242/254)
- Utilization bar — color-coded:
  - 🟢 Below 70%
  - 🟡 70–90%
  - 🔴 Above 90% (time to expand)
- Active or Inactive status

Click the arrow on any pool to expand and see: gateway IP, DNS servers, description, creation date, and linked plans.

**Pool Actions (⋮ menu):** Edit Pool, Enable/Disable, Delete Pool.

#### Static IP Blocks

Filtered view showing only STATIC type pools — useful for monitoring your static IP inventory for business customers.

#### Pool-Plan Mapping

Shows every plan and which IP pool it uses. Highlights plans with no pool assigned.

> ⚠️ Plans without an IP pool can't assign IPs to customers.

### Creating an IP Pool

Click **Add IP Pool**.

| Field | Description | Example |
|-------|-------------|---------|
| Pool Name | Unique name | "Nairobi PPPoE Pool" |
| Pool Type | Purpose of the pool | PPPoE, Static, Hotspot, DHCP |
| Prefix | First two octets | 10.50, 172.16, 192.168 |
| 3rd Octet | Third octet of the network | 3 → 10.50.3.0/24 |
| CIDR | Subnet mask | /24 (254 IPs), /16 (65K IPs) |

A live subnet preview shows the CIDR, gateway, and usable IP count as you type.

**Optional fields:** DNS Servers (defaults to 8.8.8.8, 8.8.4.4), Description, Active toggle.

> **Large Pool Warning:** Pools with over 1,000 IPs generate in the background. The pool is available immediately, but IPs may take a minute to fully populate.

### Editing an IP Pool

You can change: pool name, type, gateway IP, DNS servers, description, and active status.

> ⚠️ The subnet range cannot be changed after creation. This prevents IP conflicts with existing assignments.

### How Pool-Plan Mapping Works

1. Create an IP pool (e.g., Nairobi PPPoE Pool — 10.50.3.0/24)
2. In Plans, edit the plan and select this pool
3. Every customer on that plan automatically gets an IP from the pool

```
IP Pool (10.50.3.0/24)
 └── Plan "Home 20Mbps"
      ├── Customer 1 → 10.50.3.5
      ├── Customer 2 → 10.50.3.6
      └── Customer 3 → 10.50.3.7
```

### Pool Types

| Type | Purpose | When to Use |
|------|---------|-------------|
| PPPoE | Dynamic IPs via PPPoE | Fiber/DSL customers |
| STATIC | Fixed IP addresses | Business customers, servers, cameras |
| HOTSPOT | Hotspot network IPs | WiFi captive portal |
| DHCP | General DHCP clients | Any DHCP-enabled devices |

### FAQ

**What happens when a pool runs out of IPs?**
New customers can't get IPs. Create a new pool, then edit the plan to use it.

**Can I change the subnet range of an existing pool?**
No — it would break existing assignments. Create a new pool and update your plans.

**Can multiple plans share the same pool?**
Yes. Customers on any of those plans draw from the same pool.

**Why does my pool show "No plans linked"?**
No plan is using this pool yet. Link it by editing a plan and selecting this pool.

---

## Fair Usage Policy (FUP)

Set data limits for your customers. When they exceed their limit, their speed drops to a throttle speed you define. This keeps your network fair for everyone.

### Stats Bar

| Stat | What It Shows |
|------|--------------|
| Active Policies | FUP rules currently in effect |
| Users Under FUP | Customers being monitored |
| Active Violations | Open violations needing attention |
| Currently Throttled | Users whose speed has been reduced |

### Tabs

#### 1. Policies
All your FUP rules as cards. Each card shows policy name, status, data limit, reset period, throttle speeds, linked plans count, and user counts.

**Policy Actions (⋮ menu):** Link Plans, Edit Policy, Activate/Deactivate, Delete Policy.

#### 2. Current Usage
Real-time view of users being tracked. Shows usage progress bar, GB used vs limit, and status (Normal or Throttled).
- 🟢 Within limit
- 🔴 Exceeded limit

#### 3. Violations
Full audit log of all FUP actions — who exceeded what, what action was taken, and when. Filter by status or policy. Export to CSV for reporting.

#### 4. Analytics
Visual insights including violation trends over time, which policies have the most users, and a list of top violators this month.

#### 5. Throttled Users
Live list of currently throttled customers showing their original speed vs throttled speed and when throttling was applied.

### Creating a FUP Policy

Click **Create Policy**.

| Field | Description | Example |
|-------|-------------|---------|
| Policy Name | Unique identifier | "Bronze FUP" |
| Description | Optional notes | — |
| Data Limit (GB) | Limit before throttling kicks in | 100 GB |
| Reset Period | When usage resets | Monthly, Weekly, Daily, Peak Hours, Subscription |
| Throttle Download | Speed after limit exceeded | 2 Mbps |
| Throttle Upload | Speed after limit exceeded | 1 Mbps |
| Auto Enforce | Apply throttling automatically | On/Off |
| Notify on Violation | Send SMS alerts to customers | On/Off |

**Reset Period Options:**

| Option | How It Works |
|--------|-------------|
| Daily | Resets every day at midnight |
| Weekly | Resets every Monday at midnight |
| Monthly | Resets on the 1st of each month |
| Peak Hours | Tracks usage only during peak times |
| Subscription | Resets with each subscription renewal |

**Peak Hours** lets you set a specific window (e.g., 7 PM – 10 PM) where usage is tracked. Outside those hours, usage doesn't count toward the limit.

### Linking Plans to Policies

Click **Link Plans** on any policy. Select the plans you want this policy to apply to.

> **Note:** A plan can only be linked to one FUP policy. Linking it to a new policy automatically removes it from the old one.

### How FUP Works

**For PPPoE/Static customers:**
1. Customer subscribes to a plan with FUP
2. Usage is tracked from RADIUS accounting
3. When usage exceeds the limit → customer is throttled, a violation is logged, and an optional SMS is sent
4. When the reset period arrives → usage resets, throttle is released, fresh window begins

**For Hotspot customers:** Same enforcement logic applies.

### Deleting a Policy

> ⚠️ Deleting a policy will: release all throttled users back to their original speed, reset throttled usage windows, resolve open violations, unlink all plans, and remove the policy.

### FAQ

**Can a plan be linked to multiple FUP policies?**
No. One plan, one policy.

**What's the difference between Throttled and Violated?**
Throttled means the user's speed is currently reduced. Violated means they exceeded their limit — they may or may not be throttled yet depending on your Auto Enforce setting.

**How do I know if a user is throttled?**
Check the Throttled Users tab for a live list, or look at the status in the Current Usage tab.

**Can I manually run enforcement?**
Yes. Click Run Enforcement on any policy to immediately evaluate all linked users.

**Can I export violation data?**
Yes. Go to the Violations tab and click Export CSV.

---

## Invoice Management

Create, send, and track customer invoices.

### Stats Bar

| Stat | What It Shows |
|------|--------------|
| Total Invoices | All invoices created |
| Collected | Total amount paid |
| Pending | Amount awaiting payment |
| Overdue | Amount past due date |

### Invoice Table

| Column | Description |
|--------|-------------|
| Invoice # | Unique identifier |
| Customer | Who the invoice is for |
| Total | Amount due |
| Status | Draft / Issued / Paid / Partial / Overdue |
| Due Date | Payment deadline |
| Actions | ⋮ menu |

Filters: All, Issued, Overdue, Paid. Search by invoice number, customer name, phone, or code.

### Creating an Invoice

Click **Create Invoice** (top-right):

1. Select Customer — search by name or phone
2. Set Status — Draft or Issued
3. Choose Due Date
4. Add Line Items — description, quantity, unit price
5. Add Notes (optional)
6. Click **Create Invoice**

> **Tip:** Setting status to Issued makes the invoice live and payable immediately.

### Invoice Actions

| Action | What It Does | When Available |
|--------|-------------|----------------|
| Preview | Clean, printable view | Always |
| Details | Full invoice + payment history | Always |
| Issue | Convert draft to issued | Draft only |
| Add Payment | Record a customer payment | Issued / Overdue / Partial |
| Download PDF | Get a professional PDF copy | Always |
| Delete | Permanently remove | Always |

### Recording a Payment

Click **Add Payment** from the ⋮ menu:
1. Amount — must be ≤ remaining balance
2. Method — M-Pesa, Bank Transfer, or Cash
3. Reference — optional transaction ID
4. Click **Record Payment**

The invoice status updates to **PAID** if fully settled, or **PARTIAL** if not.

### Applying a Discount

From the Details panel:
1. Choose Percentage (%) or Fixed Amount (KES)
2. Enter the value
3. Add a reason (optional)
4. Click **Apply**

The total and balance recalculate instantly.

### Auto-Generate Invoices

Toggle **Auto-generate** at the top of the page. When enabled, the system creates invoices for PPPoE subscribers X days before their subscription expires. Configure the days-before-expiry setting in **Billing → Invoice Settings**.

### Billing Cycles

Group invoices into periods (monthly, quarterly).

| Action | What It Does |
|--------|-------------|
| Create Cycle | Start a new billing period |
| Calculate Totals | Refresh invoice sums |
| Close Cycle | Lock and finalize |

Cycle status flow: Open → Processing → Closed → Voided.

### FAQ

**What's the difference between Draft and Issued?**
Draft is a work-in-progress — it's not visible to the customer. Issued means the invoice is live and the customer owes the amount.

**Can I delete a paid invoice?**
No. Paid invoices are locked to preserve financial records.

**How does Partial work?**
When a customer pays less than the full amount, the status changes to PARTIAL. You can record more payments later until it's fully settled.

---

## Payments

View and manage all completed customer transactions.

### Stats Bar

| Stat | What It Shows |
|------|--------------|
| Total Collected | Sum of all completed payments |

### Payments Table

| Column | Description |
|--------|-------------|
| Transaction ID | M-Pesa receipt or reference number |
| Customer | Who made the payment |
| Method | M-Pesa / Bank / Cash / Card / Voucher |
| Service | Hotspot / Fiber (PPPoE) / Other |
| Amount | Payment value |
| Status | Completed (only completed payments shown) |
| Date & Time | When it was recorded |

Search by customer name, transaction ID, or receipt number.

### Pay Now

Click **Pay Now** to start a new payment through the PayHero gateway:

1. Enter Amount (KES)
2. Select Payment Method (optional)
3. Enter Phone Number (required for M-Pesa STK Push)
4. Add Invoice/Reference (optional)
5. Click **Pay Now**

What happens next depends on the method:
- **STK Push** — customer gets an M-Pesa prompt on their phone
- **Paybill/Till** — instructions appear with the number and account
- **Bank Transfer** — bank details shown for manual transfer
- **Payment Link** — opens a secure payment page in a new tab

> **Tip:** The system checks for payment confirmation automatically in the background. You can close the dialog.

### Manual Entry

Click **Manual Entry → Record Bank Transfer** to log a completed bank transfer manually.

### FAQ

**Why are only completed payments shown?**
The page focuses on finalized transactions. Pending and failed payments are not displayed.

---

## Vouchers

Generate and manage prepaid hotspot vouchers.

### Stats Bar

| Stat | What It Shows |
|------|--------------|
| Total Vouchers | All vouchers ever generated |
| Unused | Available and ready to sell |
| Used | Already redeemed |

### Vouchers Table

| Column | Description |
|--------|-------------|
| Code | Unique voucher identifier |
| PIN | Security PIN (if enabled) |
| Plan | Linked hotspot plan |
| Batch Number | Which generation batch it belongs to |
| Status | Active / Unused / Used / Expired / Cancelled |
| Uses | Number of times redeemed |
| Expiry | When the voucher expires |

Filters: All Vouchers, Unused, Used. Filter by specific hotspot plan.

### Generating Vouchers

Click **Generate Vouchers** (top-right):

1. Select Hotspot Plan
2. Set Quantity — max 50 per batch
3. Valid Days — override the plan's default expiry (optional)
4. Code Prefix — add a short prefix like "VIP" for identification (optional)
5. Click **Generate Vouchers**

A success modal shows all generated codes. Copy them individually or click **Copy All Codes**.

### Voucher Actions

| Action | What It Does |
|--------|-------------|
| Copy | Copies the voucher code to clipboard |
| Edit | Changes the expiry date |
| Delete | Permanently removes the voucher (used vouchers can't be deleted) |

### FAQ

**What's the difference between Unused and Active?**
They mean the same thing — the voucher is available and ready to redeem.

**How many vouchers can I generate at once?**
Maximum 50 per batch.

**What happens when a voucher expires?**
It becomes unusable and its status changes to Expired.

**Can I edit a voucher's plan?**
No. The plan is set at generation time. Create a new batch if you need a different plan.

**How do I share vouchers with customers?**
Copy the code and PIN from the table or the generated modal, then share via SMS, email, or print.

---

## Payment Methods

Configure how your customers pay — M-Pesa, bank transfers, and direct integrations.

### Stats Bar

| Stat | What It Shows |
|------|--------------|
| Collected This Month | Total revenue from all methods |
| Today | Today's collections |
| Success Rate | % of completed vs total payments |
| Active Channels | Active methods / total configured |

### Collection Channels

Payment methods appear as cards. Each card shows: name, type, configuration details, status, and transaction breakdown.

**Quick actions (⋮ menu):** Edit, Activate/Deactivate.

You can also click the toggle on any card to switch it on or off.

> **Note:** Only one method can be active at a time.

### Adding a Payment Method

Click **Add Method** (top-right). Maximum 3 methods allowed.

**Step 1 — Choose Type:**

| Type | Description |
|------|-------------|
| M-Pesa Paybill | Customers pay via your Paybill number |
| M-Pesa Till (Buy Goods) | Customers pay via Till number |
| Bank Transfer | Direct EFT via supported banks |

**Step 2 — Configure Details:**

For Paybill: enter your Paybill number.
For Till: enter your Till number.
For Bank Transfer: select the bank and enter the account number.

Common fields for all types:
- Display Name (e.g., "M-Pesa Business")
- Description — optional instructions for customers
- Set as default

### Integration Tabs

**Netily (Inbuilt System)** — your default gateway. Add Paybill, Till, or Bank details with no API keys needed. Funds land instantly when customers pay.

**M-Pesa Daraja** — connect your own Safaricom Daraja credentials for direct M-Pesa integration and STK push handling.

**KopoKopo** — connect your KopoKopo account to accept M-Pesa and other payments via their API.

### Activation Rules

- Only one method can be active at a time
- Activating a method automatically deactivates the current active one
- Inactive methods stay configured and can be reactivated anytime

### FAQ

**What's the difference between Netily and Daraja?**
Netily uses the inbuilt gateway — just add your Paybill/Till or bank details and you're ready. Daraja requires your own Safaricom API credentials for direct STK push handling.

**Why can't I activate two methods at once?**
One active channel ensures all payments go through a single settlement account for clean reconciliation.

**What happens when I deactivate a method?**
Customers no longer see it as a payment option. It stays configured and you can reactivate it anytime.

---

## Support Tickets

Manage customer support requests from start to finish.

### Stats Bar

| Stat | What It Shows |
|------|--------------|
| Total | All tickets ever created |
| Open | New tickets awaiting action |
| In Progress | Tickets being worked on |
| Pending | Waiting on customer response |
| Resolved | Closed tickets |
| Avg Response | Average time to first reply |
| SLA Rate | % of tickets resolved within SLA |

### Tickets Table

| Column | Description |
|--------|-------------|
| Ticket ID | Unique identifier (TKT-XXXX) |
| Subject | Brief issue description |
| Customer | Who raised the ticket |
| Category | Technical / Billing / Account / Service / Other |
| Priority | Low / Medium / High / Urgent |
| Status | Open / In Progress / Pending / Resolved / Closed |
| Assigned To | Staff member handling it |
| Created | When the ticket was opened |

Filters: tabs by status, search by ID/subject/customer name, filter by priority and category.

### Creating a Ticket

Click **New Ticket** (top-right):

1. Search Customer — by name, phone, or customer code
2. Enter Subject — brief summary
3. Select Category
4. Set Priority
5. Write Description — detailed explanation
6. Click **Create Ticket**

### Ticket Actions

| Action | What It Does |
|--------|-------------|
| View Details | Opens the ticket drawer |
| Mark In Progress | Start working on it |
| Mark Resolved | Close as resolved |
| Escalate to Urgent | Raise priority |
| Close Ticket | Permanently close |

### Ticket Drawer

Click any ticket row to open the detail panel:

- **Customer Info** — name, plan, contact details, quick call/email buttons
- **Messages** — full conversation history. Agent replies in primary color, customer messages in grey
- **Reply** — type your response and press Ctrl+Enter or click Send. Use the Escalate button to mark as Urgent, or use the status dropdown to move the ticket through your workflow

> **Tip:** Use the status dropdown to track progress: Open → In Progress → Resolved → Closed.

### FAQ

**What's the difference between Resolved and Closed?**
Resolved means the issue is fixed but the ticket can be reopened if the customer replies. Closed is permanent — it's archived.

**Can a customer reopen a resolved ticket?**
Yes. If they reply, the status automatically changes back to Open.

**What does Pending mean?**
The ticket is waiting for the customer to respond — the ball is in their court.

**Can I assign tickets to specific staff?**
Yes. Use the assign action in the dropdown menu.

---

## Leads Management

Track potential customers before they become subscribers.

### Stats Bar

| Stat | What It Shows |
|------|--------------|
| Total Leads | All leads in the system |
| Not Yet | Leads not yet converted |
| Converted | Leads that became customers |
| Conversion Rate | % of leads converted |

### Leads Table

| Column | Description |
|--------|-------------|
| Lead | Name + company (if provided) |
| Contact | Phone + email |
| Source | Where they came from (referral, Facebook, walk-in, etc.) |
| Status | Not Yet / Converted |
| Notes | Additional context |
| Actions | Convert / Delete |

Search by name, phone, or source. Filter by All / Not Yet / Converted.

### Adding a Lead

Click **Add Lead** (top-right):

1. Name (required)
2. Phone or Email — at least one required
3. Company / Location (optional)
4. Source — where they came from
5. Referred By — name of the customer, ISP, or partner who referred them
6. Status — Not Yet / Converted
7. Notes — what are they interested in?
8. Click **Save Lead**

> **Tip:** Use the Referred By field to track referral sources. This helps when applying invoice discounts.

### Lead Actions

| Action | What It Does |
|--------|-------------|
| Convert / Mark Not Yet | Toggle between Converted and Not Yet |
| Delete | Permanently remove the lead |

### FAQ

**What's the difference between a lead and a customer?**
A lead is a prospect. Once they sign up and pay, mark them as Converted — they become a customer in the system.

**Why track leads?**
To measure conversion rates, track which marketing channels work, and make sure no potential customer falls through the cracks.

**Can I edit a lead after creating it?**
Yes — click the lead row to edit name, contact, source, or notes.

---

## Loyalty Program

Reward your best customers with points, tiers, and perks.

### Stats Bar

| Stat | What It Shows |
|------|--------------|
| Total Members | Enrolled loyalty customers |
| Points Issued | Total points awarded |
| Redemptions | Total rewards claimed |
| Avg Points | Average points per member |
| Active Rewards | Currently available rewards |
| Total Spent | Total customer spend (KES) |

**Tier Distribution** badges show Bronze / Silver / Gold / Platinum / Diamond member counts at a glance.

### Tabs

#### 1. Members
Your enrolled loyalty members shown as a leaderboard. Each row shows rank, name with tier badge, customer code, phone, current points, lifetime spend, and activity summary.

**Actions:** Award Points, Award Voucher. Search by name, customer code, or phone.

#### 2. Tiers
Visual tier structure showing each tier's point threshold, points multiplier, member count, and benefits.

| Tier | Multiplier |
|------|-----------|
| Bronze | 1× |
| Silver | 2× |
| Gold | 3× |
| Platinum | 4× |
| Diamond | 5× |

#### 3. Rewards
Your rewards catalog. Each reward shows name, description, category, points cost, status, stock, and redemption count.

**Categories:** Internet, Credit, Voucher, Discount, Hardware, Other.

**Hotspot Rewards:** specify free minutes and bandwidth speed for the reward session.

#### 4. Transactions
Full audit trail of all points activity — earned, redeemed, bonus, expired, and adjusted. Useful for reconciliation and member disputes.

#### 5. Leaderboard
Three leaderboards for your top customers:

| Board | Ranking Criteria |
|-------|-----------------|
| Top Points Earners | Lifetime points earned |
| Highest Spenders | Total money spent |
| Most Returning Customers | Number of completed payments |

> **Tip:** Use leaderboards to identify and reward your most valuable customers.

#### 6. Settings
Configure how the program works:

**Points Configuration:**
- Points per KES — how many points per currency unit spent
- Currency Unit (e.g., 100 = points per KES 100)
- Signup Bonus — points awarded on enrollment
- Referral Bonus — points for referring others
- Monthly Tenure Bonus — loyalty bonus each month

**Expiry & Notifications:**
- Points Expiry toggle and expiry window (months)
- Expiry warning (days before expiry to notify)
- SMS toggles for Points Earned, Redemption, Tier Upgrade, Monthly Summary

**Program Controls:**
- Program Active toggle
- Auto-Enroll New Customers toggle

### Awarding Points

Click **Award Points** on any member:
1. Select Member
2. Enter Points
3. Select Reason — Manual Bonus, Anniversary, Referral, Compensation, Promotion, or Contest Winner
4. Toggle SMS notification on/off
5. Click **Award Points**

### Awarding a Voucher

Click **Award Voucher** on any member:
1. Select Member
2. Voucher Batch ID (optional)
3. Toggle SMS on/off
4. Click **Award Voucher**

### FAQ

**Who gets enrolled?**
All existing customers when the program is deployed. New customers are auto-enrolled if that setting is on.

**How do customers earn points?**
Through payments (based on Points per KES), signup bonus, referrals, and monthly tenure bonuses.

**What happens when points expire?**
They're deducted automatically and a transaction is logged with type "Expired."

**How do hotspot rewards work?**
When redeemed, the member gets a free WiFi session with the specified minutes and speed.

---

## Captive Portal Ads

Show ads on your hotspot login page and reward viewers with free internet.

### Stats Bar

| Stat | What It Shows |
|------|--------------|
| Impressions | Times ads were shown |
| Completions | Ads fully watched |
| Active Ads | Currently running ads |
| Ad Storage | Used / Total MB with usage bar |

> **Tip:** The storage bar turns yellow above 65% and red above 85%. Delete inactive ads to free space.

### Ad List

Ads appear as cards showing thumbnail, name, media type badge, reward badge (if any), impressions, completions, CTR, file size, and active toggle.

**Actions (⋮ menu):** Preview, Edit, Delete.

Ads appear in priority order — lower number = shown first.

### Creating an Ad

Click **New Ad** (top-right):

**Step 1 — Basic Info:** Name and Media Type (Video or Image).

**Step 2 — Media:** Upload a file or paste an external URL for hosted media.

Supported formats:
- Video: MP4, WebM
- Image: JPG, PNG, WebP

**Step 3 — Click-Through URL (optional):** Where users go when they click the ad.

**Step 4 — Reward Settings:**
- Toggle reward on/off
- Duration slider — 0 to 60 minutes in 5-minute increments
- Reward only triggers after the user completes the full ad

**Step 5 — Status & Priority:**
- Active toggle — show on captive portal
- Priority — 1 = shown first

### How Ads Work

1. User connects to hotspot WiFi
2. Captive portal loads and shows the active ad
3. User watches the full ad
4. If reward is enabled → free internet minutes are granted, RADIUS credentials are created, and the user can browse for the reward duration
5. Impressions and Completions update automatically

### Performance Metrics

| Metric | Description |
|--------|-------------|
| Impressions | Times the ad was served |
| Completions | Times it was fully watched |
| CTR | % of impressions that clicked the target URL |

### FAQ

**Can users skip ads?**
No. The reward only triggers on full completion. Skip = no free internet.

**How are ads selected?**
The highest-priority active ad is shown. One ad per login session.

**Can I use YouTube videos?**
No. Use the External URL field for hosted video files, not YouTube embeds.

**What happens when I delete an ad?**
It's permanently removed and storage is freed. Users who already earned rewards are unaffected.

---

## SMS Management

Send messages, manage templates, run bulk campaigns, and control automated notifications.

### Stats Bar

| Stat | What It Shows |
|------|--------------|
| Total Sent | All messages ever sent |
| Delivered | Successfully delivered |
| Pending | Waiting for delivery |
| Failed | Undelivered messages |
| Delivery Rate | % of messages delivered |

### Tabs

#### 1. History
Full message log — recipient, message preview, status, type (Single/Bulk/Campaign), and sent time. Search by name, phone, or message content. Filter by status.

**Actions (⋮ menu):** Retry (resend failed messages), Copy (copy message content).

#### 2. Templates
Reusable message templates with variable substitution.

**Creating a template:**
1. Enter a name
2. Select Event Type (determines available variables)
3. Write your message, clicking variables to insert them
4. Preview shows real example values

**Available variables by event type:**

| Event Type | Variables Available |
|------------|-------------------|
| Hotspot Welcome | `{plan_name}`, `{expiry_time}`, `{access_code}`, `{speed}`, `{duration}` |
| Hotspot Expired | `{plan_name}` |
| PPPoE Welcome | `{customer_name}`, `{username}`, `{password}`, `{plan_name}`, `{customer_account}` |
| PPPoE Payment | `{customer_name}`, `{amount}`, `{plan_name}`, `{reference}`, `{expiry_date}`, `{expiry_time}`, `{expiry_display}` |
| PPPoE Expiry Reminder | `{customer_name}`, `{days_left}`, `{expiry_date}`, `{plan_name}`, `{amount_due}` |
| PPPoE Expired | `{customer_name}`, `{plan_name}`, `{amount_due}`, `{customer_account}` |

#### 3. Campaigns
Send bulk SMS to customer groups.

**Target groups:** PPPoE (All/Active/Expired), Hotspot users, All customers.

Enter a Campaign Name, write your message once, then click **Send to [Group]**.

Campaign History shows all previous bulk sends with recipient counts and status.

#### 4. Notifications
Control which events send automated SMS.

**Inbuilt SMS System:** toggle to use Netily's built-in gateway. Shows your current balance and a **Buy Units** button.

**Hotspot Notifications:**
- Welcome / Session Active — confirm activation with access code
- Session Fully Expired — notify user to purchase again

**PPPoE / Static Notifications:**
- New Customer Welcome — send credentials on signup
- Payment / Renewal Confirmation — confirm payments received
- Expiry Reminder — multiple intervals (days/hours before expiry)
- Subscription Expired — one-time notification when expired

> **Tip:** Turn off notifications you don't need to save SMS units.

#### 5. Gateway
Configure your SMS provider.

**Inbuilt Mode (Netily):** managed by Netily, no API keys needed. Buy units directly.

**Custom Provider Mode:** supported providers include Africa's Talking, Twilio, Vonage, Infobip, Beem, Advanta, Hubtel, Bytewave, and BlessedTexts.

After entering credentials, click **Test** to verify the connection, then **Activate** to go live.

#### 6. Wallet (Inbuilt Mode)
Manage your SMS units.

**Pricing:**

| Units | Price | Per Unit |
|-------|-------|----------|
| 25 | KES 10 | KES 0.40 |
| 500 | KES 175 | KES 0.35 |
| 1,000 | KES 300 | KES 0.30 |
| 5,000 | KES 1,500 | KES 0.30 |

Enter a custom amount (min KES 10) to buy any quantity.

### Sending an SMS

Click **Send SMS** (top-right):
1. Recipient Type — PPPoE / Hotspot / All
2. Search and select customers
3. Select Template (optional)
4. Write message — character counter shows SMS length
5. Click **Send to [n] recipient(s)**

### FAQ

**How are SMS units counted?**
One unit per 160 characters. Longer messages use multiple units.

**What happens if I run out of units?**
In inbuilt mode, messages will fail. Top up to continue sending.

**Can I use my own SMS provider?**
Yes. Turn off Netily Inbuilt SMS in Notifications and configure your provider in the Gateway tab.

**Can I schedule SMS messages?**
Not currently — all messages send immediately.

---

## Community Board

Suggest features and vote on ideas from other ISPs on the platform.

### Overview

| Element | Description |
|---------|-------------|
| Suggest Feature | Submit your own idea |
| Upvote | Show support for an existing idea |
| Status Badge | Tracks progress of each request |
| Admin Response | Official team replies on select requests |

### Suggesting a Feature

Click **Suggest Feature** (top-right):
1. Title — short, descriptive headline
2. Category — Network & Mikrotik / Billing & Payments / Hotspot & Vouchers / Dashboard & UI / Automation / Other
3. Description — explain the problem and how this feature solves it
4. Click **Submit to Community**

Your request appears on the board immediately. Other ISPs can upvote it, and the Netily team reviews and updates the status.

### Request Status Badges

| Status | Meaning |
|--------|---------|
| Pending | Submitted, awaiting review |
| Planned | Approved and on the roadmap |
| In Progress | Being built right now |
| Completed | Released and live |
| Rejected | Not moving forward (reason in admin comment) |

### Upvoting

Click **Upvote** on any request to add your support. Click again to remove your vote. Higher upvote counts = higher priority for the team.

### Categories

| Category | Covers |
|----------|--------|
| Network & Mikrotik | Router, RADIUS, OLT, ONU, IPAM |
| Billing & Payments | Invoices, payments, M-Pesa, banking |
| Hotspot & Vouchers | Captive portal, vouchers, ad rewards |
| Dashboard & UI | User interface, usability, reporting |
| Automation | Scheduled tasks, auto-renewals, alerts |
| Other | Everything else |

### FAQ

**Can I edit my own request after submitting?**
Not currently. Submit a new request with corrections if needed.

**How many requests can I upvote?**
As many as you like.

**Who can see my request?**
All ISPs on the platform.

**How does the team decide what to build?**
A combination of upvotes, strategic priority, and feasibility.

---

## What's New

Stay up to date with the latest features, improvements, and bug fixes.

### Timeline View

Updates appear in reverse chronological order (newest first). Each entry shows:
- Date the update was released
- Version number (if applicable)
- Update type icon
- Title
- Detailed description

### Update Types

| Icon | Type | Meaning |
|------|------|---------|
| ✨ | Feature | Brand new functionality |
| ⚡ | Improvement | Enhancement to existing features |
| 🐛 | Bugfix | Issue resolved |
| 🔧 | Maintenance | Behind-the-scenes work |

### FAQ

**How often is this page updated?**
Whenever a new version of the platform is deployed.

**Can I see older updates?**
Yes — all changelogs remain visible in the timeline.

**What's the difference between Feature and Improvement?**
A Feature is something completely new. An Improvement makes something existing better — faster, easier, or more reliable.

---

## Settings

Configure your profile, company branding, security, notifications, and appearance.

### Tabs

#### Account

**Profile Information:** update First Name, Last Name, Email, Phone Number, and profile photo. Click **Save Changes**.

**Company Branding:** upload your company logo (PNG, JPG, SVG, or WebP, max 5 MB) and set your company name (appears on invoices and communications). Click **Save Logo** or **Save Company** after changes.

**Change Password:** enter current password, new password, and confirm. Minimum 8 characters with a mix of letters and numbers. Click **Change Password**.

#### Security

**Admin Login Security:**
- **Email OTP for Admin Login** — when enabled, all admins must enter a one-time code sent to their email after password login

**Customer Portal Plans:**
- **Hide lower-priced plans** — when enabled, customers on the portal only see their current plan and plans priced the same or higher (no downgrade options)

Click **Save Security Settings** or **Save Portal Settings** after changes.

#### Notifications

**MikroTik Router Offline/Online Alerts:**
- Toggle on/off to receive an SMS when any router goes offline or comes back online
- Requires an active SMS gateway (configured in SMS → Gateway)
- Add phone numbers for alert recipients (Kenyan format: 07XXXXXXXX, or international: +2547XXXXXXXX)
- Press Enter or click Add to add a number, click X to remove

#### Appearance

**Interface Mode:**
- Light — clean white interface
- Dark — easier on the eyes at night
- System — follows your device's OS setting

**Accent Colour:** choose from Ocean Blue, Emerald Green, Rose Pink, or Deep Purple. This affects buttons, links, and highlights throughout the dashboard.

### Coming Soon

These tabs are placeholders for future functionality: RADIUS, M-Pesa, SMS (use SMS Management → Gateway for now), Email, API, and Automation.

### FAQ

**How do I update my company logo?**
Go to Account tab, upload a new logo file, then click Save Logo.

**What happens if I enable OTP?**
All admins will need to enter a one-time code sent to their email after entering their password.

**Where do router offline alerts go?**
To the phone numbers you add in the Notifications tab.

**Why can't I save router alert settings?**
You need an active SMS gateway. Configure one in SMS Management → Gateway first.

**Can I change the dashboard colour scheme?**
Yes — go to Appearance and choose your Interface Mode and Accent Colour.

---

*Last updated: June 2026*
