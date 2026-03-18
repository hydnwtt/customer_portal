"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { MetricStatus } from "@prisma/client"
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
import {
  createSuccessMetric,
  updateSuccessMetric,
} from "@/app/(admin)/admin/accounts/[id]/success-plan/actions"

const schema = z.object({
  name: z.string().min(1, "Required").max(200),
  description: z.string().max(500).optional(),
  baselineValue: z.string().max(100).optional(),
  targetValue: z.string().max(100).optional(),
  currentValue: z.string().max(100).optional(),
  status: z.nativeEnum(MetricStatus),
  ownerId: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface AccountUser {
  id: string
  name: string | null
  email: string
}

interface SerializedMetric {
  id: string
  name: string
  description: string | null
  baselineValue: string | null
  targetValue: string | null
  currentValue: string | null
  status: MetricStatus
  ownerId: string | null
}

interface MetricSheetProps {
  mode: "create" | "edit"
  open: boolean
  onOpenChange: (open: boolean) => void
  accountId: string
  mspId: string
  metric?: SerializedMetric
  accountUsers: AccountUser[]
  onError: (error: string) => void
}

const STATUS_LABELS: Record<MetricStatus, string> = {
  NOT_STARTED: "Not Started",
  ON_TRACK: "On Track",
  AT_RISK: "At Risk",
  ACHIEVED: "Achieved",
}

export function MetricSheet({
  mode,
  open,
  onOpenChange,
  accountId,
  mspId,
  metric,
  accountUsers,
  onError,
}: MetricSheetProps) {
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
      baselineValue: "",
      targetValue: "",
      currentValue: "",
      status: MetricStatus.NOT_STARTED,
      ownerId: "",
    },
  })

  // Populate form when editing
  useEffect(() => {
    if (mode === "edit" && metric) {
      reset({
        name: metric.name,
        description: metric.description ?? "",
        baselineValue: metric.baselineValue ?? "",
        targetValue: metric.targetValue ?? "",
        currentValue: metric.currentValue ?? "",
        status: metric.status,
        ownerId: metric.ownerId ?? "",
      })
    } else if (mode === "create") {
      reset({
        name: "",
        description: "",
        baselineValue: "",
        targetValue: "",
        currentValue: "",
        status: MetricStatus.NOT_STARTED,
        ownerId: "",
      })
    }
  }, [mode, metric, reset])

  async function onSubmit(values: FormValues) {
    const payload = {
      accountId,
      name: values.name,
      description: values.description || undefined,
      baselineValue: values.baselineValue || undefined,
      targetValue: values.targetValue || undefined,
      currentValue: values.currentValue || undefined,
      status: values.status,
      ownerId: values.ownerId || undefined,
    }

    const result =
      mode === "create"
        ? await createSuccessMetric({ ...payload, mspId })
        : await updateSuccessMetric({ ...payload, metricId: metric!.id })

    if (!result.success) {
      onError(result.error)
      return
    }
    reset()
    onOpenChange(false)
  }

  const currentStatus = watch("status")
  const currentOwnerId = watch("ownerId")

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
          <SheetTitle>{mode === "create" ? "Add Metric" : "Edit Metric"}</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          {/* Name */}
          <div className="space-y-1">
            <Label htmlFor="metric-name">Name *</Label>
            <Input id="metric-name" {...register("name")} placeholder="e.g. Daily Active Users" />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          {/* Description */}
          <div className="space-y-1">
            <Label htmlFor="metric-desc">Description</Label>
            <Textarea
              id="metric-desc"
              {...register("description")}
              placeholder="Optional context or definition"
              className="min-h-16"
            />
          </div>

          {/* Baseline / Target / Current */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label htmlFor="metric-baseline">Baseline</Label>
              <Input id="metric-baseline" {...register("baselineValue")} placeholder="e.g. 1000" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="metric-target">Target</Label>
              <Input id="metric-target" {...register("targetValue")} placeholder="e.g. 2000" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="metric-current">Current</Label>
              <Input id="metric-current" {...register("currentValue")} placeholder="e.g. 1400" />
            </div>
          </div>

          {/* Status */}
          <div className="space-y-1">
            <Label>Status</Label>
            <Select
              value={currentStatus}
              onValueChange={(v) => setValue("status", v as MetricStatus)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(MetricStatus).map((s) => (
                  <SelectItem key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Owner */}
          {accountUsers.length > 0 && (
            <div className="space-y-1">
              <Label>Owner</Label>
              <Select
                value={currentOwnerId ?? ""}
                onValueChange={(v: string | null) => setValue("ownerId", !v || v === "__none__" ? "" : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Unassigned</SelectItem>
                  {accountUsers.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name ?? u.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <SheetFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : mode === "create" ? "Add Metric" : "Save Changes"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
