"use client"

/**
 * Small, dependency-free Markdown renderer for model output.
 * Everything is emitted as React elements (never raw HTML). Links are only
 * rendered as anchors when they point at internal /admin routes.
 */
import React from "react"
import Link from "next/link"

const INLINE_RE = /(`[^`\n]+`|\*\*[^*\n]+\*\*|__[^_\n]+__|\[[^\]\n]+\]\([^)\s]+\)|\*[^*\n]+\*)/g

function isInternalAdminHref(href: string) {
  return /^\/admin(\/[A-Za-z0-9\-._~!$&'()*+,;=:@%/]*)?(\?[^\s#]*)?(#[^\s]*)?$/.test(href) && !href.startsWith("//")
}

function renderInline(text: string, keyBase: string, onNavigate?: () => void): React.ReactNode[] {
  return text
    .split(INLINE_RE)
    .filter((p) => p !== "" && p !== undefined)
    .map((part, i) => {
      const key = `${keyBase}-${i}`
      if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
        return (
          <code key={key} className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em] text-foreground">
            {part.slice(1, -1)}
          </code>
        )
      }
      if ((part.startsWith("**") && part.endsWith("**")) || (part.startsWith("__") && part.endsWith("__"))) {
        if (part.length > 4) return <strong key={key} className="font-semibold">{renderInline(part.slice(2, -2), key, onNavigate)}</strong>
      }
      const link = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(part)
      if (link) {
        const [, label, href] = link
        if (isInternalAdminHref(href)) {
          return (
            <Link
              key={key}
              href={href}
              onClick={onNavigate}
              className="font-medium text-primary underline underline-offset-2 hover:opacity-80"
            >
              {label}
            </Link>
          )
        }
        return <React.Fragment key={key}>{label}</React.Fragment>
      }
      if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
        return <em key={key}>{part.slice(1, -1)}</em>
      }
      return <React.Fragment key={key}>{part}</React.Fragment>
    })
}

const splitRow = (line: string) =>
  line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((c) => c.trim())

const isTableSep = (line: string) => /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(line) && line.includes("-")

export function SafeMarkdown({ text, onNavigate }: { text: string; onNavigate?: () => void }) {
  const lines = text.replace(/\r\n?/g, "\n").split("\n")
  const out: React.ReactNode[] = []
  let i = 0
  let k = 0

  while (i < lines.length) {
    const line = lines[i]
    const trimmed = line.trim()

    if (!trimmed) {
      i++
      continue
    }

    // fenced code
    if (trimmed.startsWith("```")) {
      const buf: string[] = []
      i++
      while (i < lines.length && !lines[i].trim().startsWith("```")) buf.push(lines[i++])
      i++
      out.push(
        <pre key={k++} className="my-2 overflow-x-auto rounded-lg border border-border bg-muted/60 p-3 text-xs leading-relaxed">
          <code className="font-mono">{buf.join("\n")}</code>
        </pre>,
      )
      continue
    }

    // table
    if (trimmed.includes("|") && i + 1 < lines.length && isTableSep(lines[i + 1])) {
      const head = splitRow(trimmed)
      i += 2
      const rows: string[][] = []
      while (i < lines.length && lines[i].trim().includes("|")) rows.push(splitRow(lines[i++]))
      const key = `t${k++}`
      out.push(
        <div key={key} className="my-2 overflow-x-auto rounded-lg border border-border">
          <table className="w-full border-collapse text-left text-xs">
            <thead className="bg-muted/60">
              <tr>
                {head.map((h, c) => (
                  <th key={c} className="whitespace-nowrap px-2.5 py-1.5 font-semibold text-foreground">
                    {renderInline(h, `${key}h${c}`, onNavigate)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, ri) => (
                <tr key={ri} className="border-t border-border">
                  {head.map((_, c) => (
                    <td key={c} className="px-2.5 py-1.5 align-top text-foreground/90">
                      {renderInline(r[c] ?? "", `${key}r${ri}c${c}`, onNavigate)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      )
      continue
    }

    // heading
    const h = /^(#{1,4})\s+(.*)$/.exec(trimmed)
    if (h) {
      const key = `h${k++}`
      out.push(
        <p key={key} className="mb-1 mt-3 text-sm font-semibold text-foreground first:mt-0">
          {renderInline(h[2], key, onNavigate)}
        </p>,
      )
      i++
      continue
    }

    // hr
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      out.push(<hr key={k++} className="my-3 border-border" />)
      i++
      continue
    }

    // blockquote
    if (trimmed.startsWith(">")) {
      const buf: string[] = []
      while (i < lines.length && lines[i].trim().startsWith(">")) buf.push(lines[i++].trim().replace(/^>\s?/, ""))
      const key = `q${k++}`
      out.push(
        <blockquote key={key} className="my-2 border-l-2 border-primary/40 pl-3 text-muted-foreground">
          {renderInline(buf.join(" "), key, onNavigate)}
        </blockquote>,
      )
      continue
    }

    // lists
    const ul = /^[-*+]\s+/
    const ol = /^\d+[.)]\s+/
    if (ul.test(trimmed) || ol.test(trimmed)) {
      const ordered = ol.test(trimmed)
      const re = ordered ? ol : ul
      const items: string[] = []
      while (i < lines.length && re.test(lines[i].trim())) items.push(lines[i++].trim().replace(re, ""))
      const key = `l${k++}`
      const children = items.map((it, n) => (
        <li key={n} className="pl-0.5">
          {renderInline(it, `${key}-${n}`, onNavigate)}
        </li>
      ))
      out.push(
        ordered ? (
          <ol key={key} className="my-2 list-decimal space-y-1 pl-5 marker:text-muted-foreground">{children}</ol>
        ) : (
          <ul key={key} className="my-2 list-disc space-y-1 pl-5 marker:text-muted-foreground">{children}</ul>
        ),
      )
      continue
    }

    // paragraph
    const buf: string[] = []
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].trim().startsWith("```") &&
      !/^(#{1,4})\s+/.test(lines[i].trim()) &&
      !ul.test(lines[i].trim()) &&
      !ol.test(lines[i].trim()) &&
      !lines[i].trim().startsWith(">") &&
      !(lines[i].includes("|") && i + 1 < lines.length && isTableSep(lines[i + 1]))
    ) {
      buf.push(lines[i++].trim())
    }
    if (buf.length === 0) {
      buf.push(lines[i++].trim())
    }
    const key = `p${k++}`
    out.push(
      <p key={key} className="my-2 first:mt-0 last:mb-0">
        {renderInline(buf.join(" "), key, onNavigate)}
      </p>,
    )
  }

  return <div className="break-words text-sm leading-relaxed text-foreground">{out}</div>
}
