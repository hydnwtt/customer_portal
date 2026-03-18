"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { saveWelcomeContent } from "./actions"
import { formatDate, daysUntil } from "@/lib/utils"
import { cn } from "@/lib/utils"
import {
  Calendar,
  Flag,
  MapPin,
  Users,
  ExternalLink,
  BookOpen,
  Pencil,
  X,
  Check,
  Clock,
  History,
  ChevronDown,
  ChevronUp,
  Building2,
} from "lucide-react"

// ─── Types ─────────────────────────────────────────────────────────────────

interface TeamMember {
  userId: string
  name: string
  email: string
  role: string
}

interface RequiredResource {
  id: string
  title: string
  url: string
  category: string
  description: string | null
  thumbnailUrl: string | null
}

interface VersionEntry {
  content: string
  savedAt: string
  savedBy: string
}

interface Props {
  account: {
    id: string
    name: string
    status: string
    pilotStartDate: string | null
    goNoGoDate: string | null
    pilotSites: { id: string; name: string }[]
    teamMembers: TeamMember[]
  }
  welcomeContent: string
  welcomeUpdatedAt: string | null
  versions: VersionEntry[]
  requiredReading: RequiredResource[]
  isInternal: boolean
  currentUserName: string
}

// ─── Status helpers ─────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  ACTIVE_PILOT: "Active Pilot",
  EVALUATION: "Evaluation",
  CHURNED: "Churned",
  CONVERTED: "Converted",
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE_PILOT: "bg-primary/15 text-primary border border-primary/30",
  EVALUATION: "bg-amber-500/15 text-amber-400 border border-amber-500/30",
  CHURNED: "bg-destructive/15 text-destructive border border-destructive/30",
  CONVERTED: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
}

function GoNoGoCountdown({ dateStr }: { dateStr: string }) {
  const days = daysUntil(dateStr)
  if (days < 0) {
    return (
      <span className="text-sm text-muted-foreground">
        {formatDate(dateStr)}{" "}
        <span className="text-destructive/80 text-xs">({Math.abs(days)}d ago)</span>
      </span>
    )
  }
  if (days === 0) {
    return <span className="text-sm font-semibold text-destructive">Today!</span>
  }
  const color =
    days <= 7
      ? "text-destructive"
      : days <= 21
      ? "text-amber-400"
      : "text-primary"
  return (
    <span className={cn("text-sm font-semibold", color)}>
      {formatDate(dateStr)}{" "}
      <span className="text-xs font-normal opacity-70">({days}d away)</span>
    </span>
  )
}

// ─── Main component ─────────────────────────────────────────────────────────

export default function WelcomeClient({
  account,
  welcomeContent: initialContent,
  welcomeUpdatedAt,
  versions: initialVersions,
  requiredReading,
  isInternal,
  currentUserName,
}: Props) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(initialContent)
  const [liveContent, setLiveContent] = useState(initialContent)
  const [versions, setVersions] = useState(initialVersions)
  const [showHistory, setShowHistory] = useState(false)
  const [showAllSites, setShowAllSites] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleEdit() {
    setDraft(liveContent)
    setEditing(true)
  }

  function handleCancel() {
    setEditing(false)
    setDraft(liveContent)
  }

  function handleSave() {
    startTransition(async () => {
      const res = await saveWelcomeContent(account.id, draft)
      if (res.success) {
        // Prepend old content as a version locally
        if (liveContent.trim()) {
          setVersions((prev) =>
            [
              { content: liveContent, savedAt: new Date().toISOString(), savedBy: currentUserName },
              ...prev,
            ].slice(0, 10)
          )
        }
        setLiveContent(draft)
        setEditing(false)
        toast.success("Welcome page saved")
      } else {
        toast.error(res.error ?? "Failed to save")
      }
    })
  }

  function restoreVersion(v: VersionEntry) {
    setDraft(v.content)
    setEditing(true)
    setShowHistory(false)
    toast.info("Version restored — review and save to apply")
  }

  const sitesToShow = showAllSites ? account.pilotSites : account.pilotSites.slice(0, 3)
  const extraSites = account.pilotSites.length - 3

  return (
    <div className="space-y-8">
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <h1 className="font-mono text-2xl font-bold text-foreground">{account.name}</h1>
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
              STATUS_COLORS[account.status] ?? "bg-muted text-muted-foreground border border-border"
            )}
          >
            {STATUS_LABELS[account.status] ?? account.status}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          Your pilot hub — everything you need in one place.
        </p>
      </div>

      {/* ── Pilot Stats Grid ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* Start Date */}
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Start Date
            </span>
          </div>
          <p className="text-sm font-semibold text-foreground">
            {account.pilotStartDate ? formatDate(account.pilotStartDate) : "—"}
          </p>
        </div>

        {/* Go / No-Go */}
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Flag className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Go / No-Go
            </span>
          </div>
          {account.goNoGoDate ? (
            <GoNoGoCountdown dateStr={account.goNoGoDate} />
          ) : (
            <p className="text-sm text-muted-foreground">—</p>
          )}
        </div>

        {/* Sites */}
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Pilot Sites
            </span>
          </div>
          {account.pilotSites.length > 0 ? (
            <div>
              <p className="text-sm font-semibold text-foreground mb-1">
                {account.pilotSites.length}{" "}
                {account.pilotSites.length === 1 ? "site" : "sites"}
              </p>
              <ul className="space-y-0.5">
                {sitesToShow.map((s) => (
                  <li key={s.id} className="text-xs text-muted-foreground truncate">
                    {s.name}
                  </li>
                ))}
              </ul>
              {account.pilotSites.length > 3 && (
                <button
                  onClick={() => setShowAllSites((v) => !v)}
                  className="mt-1 flex items-center gap-0.5 text-xs text-primary hover:underline"
                >
                  {showAllSites ? (
                    <>
                      <ChevronUp className="h-3 w-3" /> Show less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3 w-3" /> +{extraSites} more
                    </>
                  )}
                </button>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">—</p>
          )}
        </div>

        {/* Team */}
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Team
            </span>
          </div>
          <p className="text-sm font-semibold text-foreground mb-1">
            {account.teamMembers.length}{" "}
            {account.teamMembers.length === 1 ? "member" : "members"}
          </p>
          <ul className="space-y-0.5">
            {account.teamMembers.slice(0, 3).map((m) => (
              <li key={m.userId} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Building2 className="h-3 w-3 shrink-0" />
                <span className="truncate">{m.name}</span>
              </li>
            ))}
            {account.teamMembers.length > 3 && (
              <li className="text-xs text-muted-foreground">
                +{account.teamMembers.length - 3} more
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* ── Welcome Message ──────────────────────────────────────────────── */}
      <div className="rounded-lg border border-border bg-card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h2 className="font-mono text-base font-semibold text-foreground">Welcome Message</h2>
            {welcomeUpdatedAt && !editing && (
              <p className="text-xs text-muted-foreground mt-0.5">
                Last updated {formatDate(welcomeUpdatedAt)}
              </p>
            )}
          </div>
          {isInternal && (
            <div className="flex items-center gap-2">
              {/* Version History */}
              {versions.length > 0 && !editing && (
                <button
                  onClick={() => setShowHistory((v) => !v)}
                  className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                >
                  <History className="h-3.5 w-3.5" />
                  History ({versions.length})
                </button>
              )}

              {editing ? (
                <>
                  <button
                    onClick={handleCancel}
                    className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isPending}
                    className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                  >
                    <Check className="h-3.5 w-3.5" />
                    {isPending ? "Saving…" : "Save"}
                  </button>
                </>
              ) : (
                <button
                  onClick={handleEdit}
                  className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </button>
              )}
            </div>
          )}
        </div>

        {/* Version History Panel */}
        {showHistory && versions.length > 0 && (
          <div className="border-b border-border bg-muted/20 px-5 py-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Previous Versions
            </p>
            <ul className="space-y-2">
              {versions.map((v, i) => (
                <li key={i} className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2 min-w-0">
                    <Clock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground truncate">
                      {formatDate(v.savedAt)} — {v.savedBy}
                    </span>
                  </div>
                  <button
                    onClick={() => restoreVersion(v)}
                    className="shrink-0 text-xs text-primary hover:underline"
                  >
                    Restore
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="px-5 py-5">
          {editing ? (
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={10}
              placeholder="Write a welcome message for your customer…"
              className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-y"
            />
          ) : liveContent.trim() ? (
            <div className="prose prose-invert prose-sm max-w-none">
              {liveContent.split("\n").map((line, i) =>
                line.trim() ? (
                  <p key={i} className="text-sm text-foreground leading-relaxed mb-2 last:mb-0">
                    {line}
                  </p>
                ) : (
                  <br key={i} />
                )
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <BookOpen className="h-8 w-8 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">No welcome message yet.</p>
              {isInternal && (
                <button
                  onClick={handleEdit}
                  className="mt-2 text-xs text-primary hover:underline"
                >
                  Add one now
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Required Reading ─────────────────────────────────────────────── */}
      {requiredReading.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="h-4 w-4 text-primary" />
            <h2 className="font-mono text-base font-semibold text-foreground">Required Reading</h2>
            <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
              {requiredReading.length}
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {requiredReading.map((r) => (
              <a
                key={r.id}
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col rounded-lg border border-border bg-card p-4 hover:border-primary/40 hover:bg-card/80 transition-colors"
              >
                {r.thumbnailUrl && (
                  <div className="mb-3 h-32 w-full overflow-hidden rounded-md bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={r.thumbnailUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2">
                      {r.title}
                    </p>
                    {r.description && (
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                        {r.description}
                      </p>
                    )}
                    <span className="mt-2 inline-block text-xs text-muted-foreground/70">
                      {r.category}
                    </span>
                  </div>
                  <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50 group-hover:text-primary transition-colors mt-0.5" />
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* ── Quick Nav (only if no required reading, to fill the page) ────── */}
      {requiredReading.length === 0 && (
        <div className="rounded-lg border border-dashed border-border p-6 text-center">
          <p className="text-sm text-muted-foreground">
            No required reading resources yet.{" "}
            {isInternal && (
              <span className="text-primary">
                Add resources in the{" "}
                <a href="resources" className="underline hover:no-underline">
                  Resource Library
                </a>{" "}
                and mark them as Required Reading.
              </span>
            )}
          </p>
        </div>
      )}
    </div>
  )
}
