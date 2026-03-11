import { generateHTML } from "@tiptap/core"
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import Link from "@tiptap/extension-link"
import Image from "@tiptap/extension-image"
import type { JSONContent } from "@tiptap/core"

const EXTENSIONS = [StarterKit, Underline, Link, Image]

interface TiptapRendererProps {
  content: unknown
  className?: string
}

export function TiptapRenderer({ content, className }: TiptapRendererProps) {
  if (!content || typeof content !== "object") return null

  let html: string
  try {
    html = generateHTML(content as JSONContent, EXTENSIONS)
  } catch {
    return null
  }

  if (!html || html === "<p></p>") return null

  return (
    <div
      className={`prose prose-sm max-w-none dark:prose-invert ${className ?? ""}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
