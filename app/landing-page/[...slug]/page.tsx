import { notFound, permanentRedirect } from "next/navigation"
import { marketingPaths } from "@/components/marketing/content"

type Props = {
  params: Promise<{ slug: string[] }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function PreviousPreviewRoute({ params, searchParams }: Props) {
  const { slug } = await params
  const path = `/${slug.join("/")}`
  if (!marketingPaths.includes(path)) notFound()
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(await searchParams)) {
    for (const item of Array.isArray(value) ? value : value === undefined ? [] : [value]) query.append(key, item)
  }
  permanentRedirect(`${path}${query.size ? `?${query}` : ""}`)
}
