"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { createResource, updateResource, deleteResource, RESOURCE_CATEGORIES } from "./actions"
import { cn } from "@/lib/utils"
import { ExternalLink, BookOpen, Star } from "lucide-react"

interface Resource {
  id: string
  title: string
  url: string
  category: string
  description: string | null
  thumbnailUrl: string | null
  isRequiredReading: boolean
}

interface Props {
  accountId: string
  resources: Resource[]
  isInternal: boolean
}

const EMPTY_FORM = {
  title: "",
  url: "",
  category: "Documentation" as (typeof RESOURCE_CATEGORIES)[number],
  description: "",
  thumbnailUrl: "",
  isRequiredReading: false,
}

export default function ResourceLibraryClient({ accountId, resources: initial, isInternal }: Props) {
  const [resources, setResources] = useState(initial)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [filterCategory, setFilterCategory] = useState("ALL")
  const [isPending, startTransition] = useTransition()

  function openAdd() {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setShowForm(true)
  }

  function openEdit(r: Resource) {
    setForm({
      title: r.title,
      url: r.url,
      category: r.category as (typeof RESOURCE_CATEGORIES)[number],
      description: r.description ?? "",
      thumbnailUrl: r.thumbnailUrl ?? "",
      isRequiredReading: r.isRequiredReading,
    })
    setEditingId(r.id)
    setShowForm(true)
  }

  function handleSubmit() {
    startTransition(async () => {
      if (editingId) {
        const res = await updateResource({ id: editingId, accountId, ...form })
        if (res.success) {
          setResources((prev) =>
            prev.map((r) =>
              r.id === editingId
                ? {
                    ...r,
                    ...form,
                    description: form.description || null,
                    thumbnailUrl: form.thumbnailUrl || null,
                  }
                : r
            )
          )
          toast.success("Resource updated")
        } else {
          toast.error(res.error)
          return
        }
      } else {
        const res = await createResource({ accountId, ...form })
        if (res.success) {
          setResources((prev) => [
            {
              id: res.id,
              ...form,
              description: form.description || null,
              thumbnailUrl: form.thumbnailUrl || null,
            },
            ...prev,
          ])
          toast.success("Resource added")
        } else {
          toast.error(res.error)
          return
        }
      }
      setShowForm(false)
      setEditingId(null)
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const res = await deleteResource(id, accountId)
      if (res.success) {
        setResources((prev) => prev.filter((r) => r.id !== id))
        toast.success("Resource removed")
      } else {
        toast.error(res.error)
      }
    })
  }

  const categories = ["ALL", ...RESOURCE_CATEGORIES]
  const filtered = filterCategory === "ALL" ? resources : resources.filter((r) => r.category === filterCategory)
  const requiredReading = resources.filter((r) => r.isRequiredReading)

  const inputClass =
    "w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"

  return (
    <div className="space-y-6">
      {/* Required reading banner */}
      {requiredReading.length > 0 && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Star className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold text-primary">Required Reading</p>
          </div>
          <div className="space-y-2">
            {requiredReading.map((r) => (
              <a
                key={r.id}
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-foreground hover:text-primary transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                {r.title}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setFilterCategory(c)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                filterCategory === c
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              {c}
            </button>
          ))}
        </div>
        {isInternal && !showForm && (
          <button
            onClick={openAdd}
            className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
          >
            + Add Resource
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h3 className="font-mono text-sm font-semibold text-foreground">
            {editingId ? "Edit Resource" : "Add Resource"}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-muted-foreground mb-1">Title *</label>
              <input className={inputClass} value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Resource title" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-muted-foreground mb-1">URL *</label>
              <input type="url" className={inputClass} value={form.url} onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))} placeholder="https://…" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Category</label>
              <select className={inputClass} value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as (typeof RESOURCE_CATEGORIES)[number] }))}>
                {RESOURCE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Thumbnail URL</label>
              <input type="url" className={inputClass} value={form.thumbnailUrl} onChange={(e) => setForm((f) => ({ ...f, thumbnailUrl: e.target.value }))} placeholder="https://…" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-muted-foreground mb-1">Description</label>
              <input className={inputClass} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Brief description of this resource" />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="required-reading"
                checked={form.isRequiredReading}
                onChange={(e) => setForm((f) => ({ ...f, isRequiredReading: e.target.checked }))}
                className="rounded border-border"
              />
              <label htmlFor="required-reading" className="text-sm text-foreground">Required Reading</label>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => { setShowForm(false); setEditingId(null) }} className="text-sm text-muted-foreground hover:text-foreground">Cancel</button>
            <button onClick={handleSubmit} disabled={isPending || !form.title || !form.url} className="rounded-md bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
              {isPending ? "Saving…" : editingId ? "Update" : "Add"}
            </button>
          </div>
        </div>
      )}

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <BookOpen className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            {resources.length === 0
              ? isInternal
                ? "No resources yet. Add the first one above."
                : "No resources have been added yet."
              : "No resources in this category."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((r) => (
            <div key={r.id} className="rounded-xl border border-border bg-card overflow-hidden flex flex-col">
              {r.thumbnailUrl && (
                <img
                  src={r.thumbnailUrl}
                  alt=""
                  className="w-full h-32 object-cover border-b border-border"
                />
              )}
              <div className="p-4 flex-1 flex flex-col">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="font-medium text-sm text-foreground leading-snug">{r.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">{r.category}</span>
                      {r.isRequiredReading && (
                        <span className="flex items-center gap-0.5 text-xs text-primary font-medium">
                          <Star className="h-3 w-3" /> Required
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {r.description && (
                  <p className="text-xs text-muted-foreground mb-3 flex-1">{r.description}</p>
                )}
                <div className="flex items-center justify-between mt-auto pt-2">
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Open
                  </a>
                  {isInternal && (
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(r)} className="text-xs text-muted-foreground hover:text-foreground">Edit</button>
                      <button onClick={() => handleDelete(r.id)} className="text-xs text-destructive hover:underline">Delete</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
