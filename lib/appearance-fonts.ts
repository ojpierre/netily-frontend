export type AppearanceFont =
  | "outfit"
  | "montserrat"
  | "space-grotesk"
  | "calibri"
  | "inter"
  | "roboto"
  | "lato"
  | "open-sans"
  | "source-sans-3"
  | "ibm-plex-sans"
  | "manrope"
  | "dm-sans"
  | "poppins"
  | "plus-jakarta-sans"
  | "work-sans"
  | "archivo"

export const DEFAULT_APPEARANCE_FONT: AppearanceFont = "outfit"
export const APPEARANCE_FONT_STORAGE_KEY = "netily-appearance-font"

export const APPEARANCE_FONTS: Array<{
  value: AppearanceFont
  label: string
  description: string
  sample: string
}> = [
  { value: "outfit", label: "Outfit", description: "Default, modern and readable", sample: "Aa 123" },
  { value: "montserrat", label: "Montserrat", description: "Confident geometric headings", sample: "Aa 123" },
  { value: "space-grotesk", label: "Space Grotesk", description: "Contemporary technical feel", sample: "Aa 123" },
  { value: "calibri", label: "Calibri", description: "Familiar corporate system font", sample: "Aa 123" },
  { value: "inter", label: "Inter", description: "Crisp for dense dashboards", sample: "Aa 123" },
  { value: "roboto", label: "Roboto", description: "Neutral and dependable", sample: "Aa 123" },
  { value: "lato", label: "Lato", description: "Warm professional interface", sample: "Aa 123" },
  { value: "open-sans", label: "Open Sans", description: "Highly legible at small sizes", sample: "Aa 123" },
  { value: "source-sans-3", label: "Source Sans 3", description: "Clean enterprise typography", sample: "Aa 123" },
  { value: "ibm-plex-sans", label: "IBM Plex Sans", description: "Structured and polished", sample: "Aa 123" },
  { value: "manrope", label: "Manrope", description: "Quiet, modern SaaS typography", sample: "Aa 123" },
  { value: "dm-sans", label: "DM Sans", description: "Friendly product interface feel", sample: "Aa 123" },
  { value: "poppins", label: "Poppins", description: "Rounded geometric brand voice", sample: "Aa 123" },
  { value: "plus-jakarta-sans", label: "Plus Jakarta Sans", description: "Premium corporate clarity", sample: "Aa 123" },
  { value: "work-sans", label: "Work Sans", description: "Practical and spacious for dashboards", sample: "Aa 123" },
  { value: "archivo", label: "Archivo", description: "Strong headings with technical confidence", sample: "Aa 123" },
]

export function isAppearanceFont(value: unknown): value is AppearanceFont {
  return typeof value === "string" && APPEARANCE_FONTS.some((font) => font.value === value)
}

export function applyAppearanceFont(value: unknown) {
  const font = isAppearanceFont(value) ? value : DEFAULT_APPEARANCE_FONT
  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("data-font", font)
  }
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(APPEARANCE_FONT_STORAGE_KEY, font)
  }
  return font
}
