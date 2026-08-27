with open('app/admin/settings/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add ComingSoonTab component before AccountSettingsTab
coming_soon_component = '''// -- Coming Soon placeholder --
function ComingSoonTab({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-5">
        <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" /></svg>
      </div>
      <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">{label} \u2014 Coming Soon</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">This section is still being built. Check back soon.</p>
    </div>
  )
}

'''
if 'function ComingSoonTab' not in content:
    content = content.replace('function AccountSettingsTab()', coming_soon_component + 'function AccountSettingsTab()')
    print("Added ComingSoonTab component")

# 2. Replace TabsList - find it and replace with account-only version
tabs_list_start_marker = '          <TabsList className="inline-flex w-full md:w-auto">'
tabs_list_end_marker = '          </TabsList>'
idx_start = content.index(tabs_list_start_marker)
idx_end = content.index(tabs_list_end_marker, idx_start) + len(tabs_list_end_marker)
old_tabs_list = content[idx_start:idx_end]
new_tabs_list = '''          <TabsList className="inline-flex w-full md:w-auto">
            <TabsTrigger value="account" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Account</span>
            </TabsTrigger>
            {/* TODO: radius | mpesa | sms | email | api | automation | notifications | security — coming soon */}
          </TabsList>'''
content = content.replace(old_tabs_list, new_tabs_list, 1)
print(f"Replaced TabsList: {len(old_tabs_list)} -> {len(new_tabs_list)} chars")

# 3. For each section, find the comment and replace the full TabsContent block
sections = [
    ('RADIUS Settings', 'radius', 'RADIUS'),
    ('M-Pesa Settings', 'mpesa', 'M-Pesa'),
    ('SMS Gateway Settings', 'sms', 'SMS'),
    ('Email Settings', 'email', 'Email'),
    ('API Keys Settings', 'api', 'API'),
    ('Automation Settings', 'automation', 'Automation'),
    ('Notification Settings', 'notifications', 'Notifications'),
    ('Security Settings', 'security', 'Security'),
]

for (comment, value, label) in sections:
    comment_str = f'        {{/* {comment} */}}'
    if comment_str not in content:
        print(f"WARNING: could not find comment for '{comment}'")
        continue

    section_start = content.index(comment_str)
    # Find the FIRST occurrence of newline+8spaces+</TabsContent> after section_start
    # This is the section-level closing tag (card-level closing is at 10+ spaces)
    close_tag = '\n        </TabsContent>'
    section_end = content.index(close_tag, section_start) + len(close_tag)
    old_len = section_end - section_start

    new_section = f'        {{/* {comment} \u2014 TODO: coming soon */}}\n        <TabsContent value="{value}" className="space-y-6">\n          <ComingSoonTab label="{label}" />\n        </TabsContent>'
    content = content[:section_start] + new_section + content[section_end:]
    print(f"Replaced '{comment}': {old_len} chars -> {len(new_section)} chars")

with open('app/admin/settings/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

lines = content.splitlines()
print(f"\nDone! File now has {len(lines)} lines")
print(f"ComingSoonTab occurrences: {content.count('ComingSoonTab')}")
print(f"TabsTrigger occurrences: {content.count('TabsTrigger')}")
