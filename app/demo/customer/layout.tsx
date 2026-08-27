import { DemoCustomerShell } from "./demo-customer-shell"

export default function DemoCustomerLayout({ children }: { children: React.ReactNode }) {
  return <DemoCustomerShell>{children}</DemoCustomerShell>
}
