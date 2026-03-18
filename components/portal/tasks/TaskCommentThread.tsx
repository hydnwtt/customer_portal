"use client"

import { useState, useTransition } from "react"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { timeAgo } from "@/lib/utils"
import {
  createTaskComment,
  deleteTaskComment,
} from "@/app/(portal)/[slug]/tasks/actions"
import type { SerializedComment } from "./TasksContent"

interface TaskCommentThreadProps {
  taskId: string
  comments: SerializedComment[]
  currentUserId: string | null
}

export function TaskCommentThread({
  taskId,
  comments,
  currentUserId,
}: TaskCommentThreadProps) {
  const [optimisticComments, setOptimisticComments] =
    useState<SerializedComment[]>(comments)
  const [content, setContent] = useState("")
  const [isPending, startTransition] = useTransition()
  const [postError, setPostError] = useState<string | null>(null)

  function handleDelete(commentId: string) {
    setOptimisticComments((prev) => prev.filter((c) => c.id !== commentId))
    startTransition(async () => {
      const result = await deleteTaskComment({ commentId })
      if (!result.success) {
        // Restore comment on failure
        setOptimisticComments(comments)
      }
    })
  }

  function handlePost() {
    const trimmed = content.trim()
    if (!trimmed) return
    setPostError(null)
    startTransition(async () => {
      const result = await createTaskComment({ taskId, content: trimmed })
      if (!result.success) {
        setPostError(result.error)
      } else {
        setContent("")
      }
    })
  }

  return (
    <div className="mt-3 border-t pt-3 space-y-3">
      {/* Comment list */}
      {optimisticComments.length > 0 && (
        <div className="space-y-3">
          {optimisticComments.map((c) => (
            <div key={c.id} className="flex items-start justify-between gap-2">
              <div className="space-y-0.5 min-w-0 flex-1">
                <div>
                  <span className="text-xs font-medium">{c.authorName}</span>
                  <span className="text-xs text-muted-foreground ml-1">
                    {timeAgo(c.createdAt)}
                  </span>
                </div>
                <p className="text-sm">{c.content}</p>
              </div>
              {c.authorId === currentUserId && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleDelete(c.id)}
                  disabled={isPending}
                  className="shrink-0 text-muted-foreground hover:text-destructive disabled:opacity-30"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add comment form */}
      {currentUserId !== null && (
        <div className="space-y-2">
          <Textarea
            className="min-h-16 text-sm"
            placeholder="Add a comment…"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          {postError && <p className="text-xs text-destructive">{postError}</p>}
          <Button
            size="sm"
            onClick={handlePost}
            disabled={isPending || !content.trim()}
          >
            {isPending ? "Posting…" : "Post"}
          </Button>
        </div>
      )}
    </div>
  )
}
