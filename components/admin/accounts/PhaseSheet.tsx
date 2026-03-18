"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { PhaseStatus } from "@prisma/client"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createPhase, updatePhase } from "@/app/(admin)/admin/accounts/[id]/timeline/actions"

const schema = z.object({
  name: z.string().min(1, "Required").max(200),
  description: z.string().max(500).optional(),
  startDate: z.string().optional(),
  targetEndDate: z.string().optional(),
  actualEndDate: z.string().optional(),
  status: z.nativeEnum(PhaseStatus),
})

type FormValues = z.infer<typeof schema>

interface SerializedPhase {
  id: string
  name: string
  description: string | null
  startDate: string | null
  targetEndDate: string | null
  actualEndDate: string | null
  status: PhaseStatus
}

interface PhaseSheetProps {
  mode: "create" | "edit"
  open: boolean
  onOpenChange: (open: boolean) => void
  accountId: string
  phase?: SerializedPhase
  onError: (error: string) => void
}

const STATUS_LABELS: Record<PhaseStatus, string> = {
  NOT_STARTED: "Not Started",
  IN_PROGRESS: "In Progress",
  COMPLETE: "Complete",
  BLOCKED: "Blocked",
}

// Convert ISO string to yyyy-MM-dd for <input type="date">
function toDateInput(iso: string | null | undefined): string {
  if (!iso) return ""
  return iso.slice(0, 10)
}

export function PhaseSheet({
  mode,
  open,
  onOpenChange,
  accountId,
  phase,
  onError,
}: PhaseSheetProps) {
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      description: "",
      startDate: "",
      targetEndDate: "",
      actualEndDate: "",
      status: PhaseStatus.NOT_STARTED,
    },
  })

  useEffect(() => {
    if (mode === "edit" && phase) {
      reset({
        name: phase.name,
        description: phase.description ?? "",
        startDate: toDateInput(phase.startDate),
        targetEndDate: toDateInput(phase.targetEndDate),
        actualEndDate: toDateInput(phase.actualEndDate),
        status: phase.status,
      })
    } else if (mode === "create") {
      reset({
        name: "",
        description: "",
        startDate: "",
        targetEndDate: "",
        actualEndDate: "",
        status: PhaseStatus.NOT_STARTED,
      })
    }
  }, [mode, phase, reset])

  async function onSubmit(values: FormValues) {
    const payload = {
      accountId,
      name: values.name,
      description: values.description || undefined,
      startDate: values.startDate || undefined,
      targetEndDate: values.targetEndDate || undefined,
      status: values.status,
    }

    const result =
      mode === "create"
        ? await createPhase(payload)
        : await updatePhase({
            ...payload,
            phaseId: phase!.id,
            actualEndDate: values.actualEndDate || undefined,
          })

    if (!result.success) {
      onError(result.error)
      return
    }
    reset()
    onOpenChange(false)
  }

  const currentStatus = watch("status")

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        if (!v) reset()
        onOpenChange(v)
      }}
    >
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{mode === "create" ? "Add Phase" : "Edit Phase"}</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          {/* Name */}
          <div className="space-y-1">
            <Label htmlFor="phase-name">Name *</Label>
            <Input id="phase-name" {...register("name")} placeholder="e.g. Onboarding" />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          {/* Description */}
          <div className="space-y-1">
            <Label htmlFor="phase-desc">Description</Label>
            <Textarea
              id="phase-desc"
              {...register("description")}
              placeholder="Optional phase description"
              className="min-h-16"
            />
          </div>

          {/* Start / Target End Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="phase-start">Start Date</Label>
              <Input id="phase-start" type="date" {...register("startDate")} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="phase-target">Target End</Label>
              <Input id="phase-target" type="date" {...register("targetEndDate")} />
            </div>
          </div>

          {/* Actual End Date — edit only */}
          {mode === "edit" && (
            <div className="space-y-1">
              <Label htmlFor="phase-actual">Actual End Date</Label>
              <Input id="phase-actual" type="date" {...register("actualEndDate")} />
            </div>
          )}

          {/* Status */}
          <div className="space-y-1">
            <Label>Status</Label>
            <Select
              value={currentStatus}
              onValueChange={(v: string | null) =>
                setValue("status", (v ?? PhaseStatus.NOT_STARTED) as PhaseStatus)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(PhaseStatus).map((s) => (
                  <SelectItem key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <SheetFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : mode === "create" ? "Add Phase" : "Save Changes"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
