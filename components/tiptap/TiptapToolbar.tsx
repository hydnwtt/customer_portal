"use client"

import type { Editor } from "@tiptap/react"
import {
  Bold, Italic, Underline, Heading2, Heading3,
  List, ListOrdered, Quote, Link2, RemoveFormatting
} from "lucide-react"
import { cn } from "@/lib/utils"

interface TiptapToolbarProps {
  editor: Editor | null
}

interface ToolbarButton {
  label: string
  icon: React.ElementType
  action: () => void
  isActive: boolean
}

export function TiptapToolbar({ editor }: TiptapToolbarProps) {
  if (!editor) return null

  const buttons: ToolbarButton[] = [
    {
      label: "Bold",
      icon: Bold,
      action: () => editor.chain().focus().toggleBold().run(),
      isActive: editor.isActive("bold"),
    },
    {
      label: "Italic",
      icon: Italic,
      action: () => editor.chain().focus().toggleItalic().run(),
      isActive: editor.isActive("italic"),
    },
    {
      label: "Underline",
      icon: Underline,
      action: () => editor.chain().focus().toggleUnderline().run(),
      isActive: editor.isActive("underline"),
    },
    {
      label: "Heading 2",
      icon: Heading2,
      action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      isActive: editor.isActive("heading", { level: 2 }),
    },
    {
      label: "Heading 3",
      icon: Heading3,
      action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
      isActive: editor.isActive("heading", { level: 3 }),
    },
    {
      label: "Bullet list",
      icon: List,
      action: () => editor.chain().focus().toggleBulletList().run(),
      isActive: editor.isActive("bulletList"),
    },
    {
      label: "Ordered list",
      icon: ListOrdered,
      action: () => editor.chain().focus().toggleOrderedList().run(),
      isActive: editor.isActive("orderedList"),
    },
    {
      label: "Blockquote",
      icon: Quote,
      action: () => editor.chain().focus().toggleBlockquote().run(),
      isActive: editor.isActive("blockquote"),
    },
    {
      label: "Link",
      icon: Link2,
      action: () => {
        const url = window.prompt("URL")
        if (url) editor.chain().focus().setLink({ href: url }).run()
        else editor.chain().focus().unsetLink().run()
      },
      isActive: editor.isActive("link"),
    },
    {
      label: "Clear formatting",
      icon: RemoveFormatting,
      action: () => editor.chain().focus().clearNodes().unsetAllMarks().run(),
      isActive: false,
    },
  ]

  return (
    <div className="flex flex-wrap gap-0.5 rounded-t-md border border-b-0 border-input bg-muted/30 p-1.5">
      {buttons.map((btn) => {
        const Icon = btn.icon
        return (
          <button
            key={btn.label}
            type="button"
            title={btn.label}
            onClick={btn.action}
            className={cn(
              "rounded p-1.5 transition-colors hover:bg-accent hover:text-accent-foreground",
              btn.isActive && "bg-accent text-accent-foreground"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
          </button>
        )
      })}
    </div>
  )
}
