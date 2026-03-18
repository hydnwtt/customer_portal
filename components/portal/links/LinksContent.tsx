"use client"

import { ExternalLink } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface SerializedLink {
  id: string
  title: string
  url: string
  category: string
  description: string | null
  isRequiredReading: boolean
}

interface LinksContentProps {
  links: SerializedLink[]
}

function groupByCategory(links: SerializedLink[]): [string, SerializedLink[]][] {
  const map = new Map<string, SerializedLink[]>()
  for (const link of links) {
    const group = map.get(link.category) ?? []
    group.push(link)
    map.set(link.category, group)
  }
  return Array.from(map.entries())
}

function getHostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return url
  }
}

export function LinksContent({ links }: LinksContentProps) {
  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-foreground">Helpful Links</h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Curated resources, documentation, and training for this pilot.
      </p>

      {links.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-12 text-center">
          <p className="text-sm text-muted-foreground">
            Your resource library is being curated — check back soon.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {groupByCategory(links).map(([category, categoryLinks]) => (
            <section key={category}>
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {category}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {categoryLinks.map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex flex-col gap-2 rounded-lg border border-border bg-card p-4 transition-shadow hover:shadow-md"
                  >
                    {link.isRequiredReading && (
                      <Badge variant="secondary" className="self-start text-xs">
                        Required Reading
                      </Badge>
                    )}
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-medium text-foreground group-hover:text-primary">
                        {link.title}
                      </span>
                      <ExternalLink className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                    </div>
                    {link.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {link.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">{getHostname(link.url)}</p>
                  </a>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
