import type { ReactNode } from "react"
import { AcademyCartProvider } from "./academy-cart"
import "./academy.css"

export default function AcademyLayout({ children }: { children: ReactNode }) {
  return (
    <div className="academy-site">
      <AcademyCartProvider>{children}</AcademyCartProvider>
    </div>
  )
}
