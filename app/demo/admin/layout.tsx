import { DemoAdminShell } from "./demo-admin-shell"

export default function DemoAdminLayout({ children }: { children: React.ReactNode }) {
  return <DemoAdminShell>{children}</DemoAdminShell>
}
