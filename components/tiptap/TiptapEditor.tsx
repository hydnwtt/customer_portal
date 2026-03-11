"use client"

import { forwardRef, useImperativeHandle } from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import Link from "@tiptap/extension-link"
import Image from "@tiptap/extension-image"
import Placeholder from "@tiptap/extension-placeholder"
import type { JSONContent } from "@tiptap/core"
import { TiptapToolbar } from "./TiptapToolbar"
import { cn } from "@/lib/utils"

export interface TiptapEditorHandle {
  getJSON: () => JSONContent
}

interface TiptapEditorProps {
  initialContent?: unknown
  placeholder?: string
  className?: string
}

export const TiptapEditor = forwardRef<TiptapEditorHandle, TiptapEditorProps>(
  function TiptapEditor({ initialContent, placeholder = "Start writing…", className }, ref) {
    const editor = useEditor({
      extensions: [
        StarterKit,
        Underline,
        Link.configure({ openOnClick: false }),
        Image,
        Placeholder.configure({ placeholder }),
      ],
      content: (initialContent as JSONContent) ?? undefined,
      editorProps: {
        attributes: {
          class: "min-h-[240px] p-3 focus:outline-none prose prose-sm max-w-none dark:prose-invert",
        },
      },
    })

    useImperativeHandle(ref, () => ({
      getJSON: () => editor?.getJSON() ?? { type: "doc", content: [] },
    }))

    return (
      <div className={cn("overflow-hidden rounded-md border border-input bg-background", className)}>
        <TiptapToolbar editor={editor} />
        <EditorContent editor={editor} />
      </div>
    )
  }
)
