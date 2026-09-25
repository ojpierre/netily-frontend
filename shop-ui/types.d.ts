declare module "sonner" {
  import type { ComponentType } from "react"

  export const Toaster: ComponentType<Record<string, unknown>>
  export const toast: {
    success: (message: string) => void
    error: (message: string) => void
    info: (message: string) => void
  }
}
