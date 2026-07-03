"use client"

import React from "react"

function renderInline(text: string) {
  return text
    .split(/(<u>.*?<\/u>|\*\*[^*]+\*\*|\*[^*]+\*)/g)
    .filter(Boolean)
    .map((part, index) => {
      if (part.startsWith("<u>") && part.endsWith("</u>")) {
        return <u key={index}>{part.slice(3, -4)}</u>
      }
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={index}>{part.slice(2, -2)}</strong>
      }
      if (part.startsWith("*") && part.endsWith("*")) {
        return <em key={index}>{part.slice(1, -1)}</em>
      }
      return <React.Fragment key={index}>{part}</React.Fragment>
    })
}

export function AssistantMessage({ text }: { text: string }) {
  const lines = text.split("\n")
  const nodes: React.ReactNode[] = []

  lines.forEach((line, index) => {
    const trimmed = line.trim()
    if (!trimmed) {
      nodes.push(<div key={`space-${index}`} className="h-2" />)
      return
    }

    const ordered = trimmed.match(/^(\d+)\.\s+(.+)$/)
    if (ordered) {
      nodes.push(
        <div key={index} className="flex gap-2">
          <span className="font-semibold text-current/70">{ordered[1]}.</span>
          <span>{renderInline(ordered[2])}</span>
        </div>,
      )
      return
    }

    const bullet = trimmed.match(/^[-*]\s+(.+)$/)
    if (bullet) {
      nodes.push(
        <div key={index} className="flex gap-2">
          <span className="text-current/60">-</span>
          <span>{renderInline(bullet[1])}</span>
        </div>,
      )
      return
    }

    nodes.push(<p key={index}>{renderInline(trimmed)}</p>)
  })

  return <div className="space-y-1.5 leading-6">{nodes}</div>
}
