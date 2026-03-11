"use client"

import { TiptapRenderer } from "@/components/tiptap/TiptapRenderer"
import { ExternalLink } from "lucide-react"

interface RequiredLink {
  id: string
  title: string
  url: string
  description: string | null
}

interface WelcomePageContentProps {
  content: unknown
  requiredLinks: RequiredLink[]
}

export function WelcomePageContent({ content, requiredLinks }: WelcomePageContentProps) {
  const hasContent = content && typeof content === "object"

  return (
    <div className="space-y-8">
      {/* Main welcome content */}
      {hasContent ? (
        <TiptapRenderer content={content} />
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
          <p className="text-sm font-medium text-muted-foreground">
            Your CSM is preparing this page — check back soon.
          </p>
        </div>
      )}

      {/* Required Reading */}
      {requiredLinks.length > 0 && (
        <section>
          <h2 className="mb-4 text-base font-semibold text-foreground">Required Reading</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {requiredLinks.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col gap-1.5 rounded-lg border border-border bg-card p-4 transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm font-medium text-foreground group-hover:text-primary">
                    {link.title}
                  </span>
                  <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                </div>
                {link.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{link.description}</p>
                )}
              </a>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
