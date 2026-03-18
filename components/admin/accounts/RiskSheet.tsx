"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { RiskSeverity } from "@prisma/client"
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
import { createRisk, updateRisk } from "@/app/(admin)/admin/accounts/[id]/success-plan/actions"

const schema = z.object({
  description: z.string().min(1, "Required").max(1000),
  severity: z.nativeEnum(RiskSeverity),
  mitigationPlan: z.string().max(1000).optional(),
  owner: z.string().max(200).optional(),
})

type FormValues = z.infer<typeof schema>

interface SerializedRisk {
  id: string
  description: string
  severity: RiskSeverity
  mitigationPlan: string | null
  owner: string | null
}

interface RiskSheetProps {
  mode: "create" | "edit"
  open: boolean
  onOpenChange: (open: boolean) => void
  accountId: string
  mspId: string
  risk?: SerializedRisk
  onError: (error: string) => void
}

const SEVERITY_LABELS: Record<RiskSeverity, string> = {
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
}

export function RiskSheet({
  mode,
  open,
  onOpenChange,
  accountId,
  mspId,
  risk,
  onError,
}: RiskSheetProps) {
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
      description: "",
      severity: RiskSeverity.MEDIUM,
      mitigationPlan: "",
      owner: "",
    },
  })

  useEffect(() => {
    if (mode === "edit" && risk) {
      reset({
        description: risk.description,
        severity: risk.severity,
        mitigationPlan: risk.mitigationPlan ?? "",
        owner: risk.owner ?? "",
      })
    } else if (mode === "create") {
      reset({
        description: "",
        severity: RiskSeverity.MEDIUM,
        mitigationPlan: "",
        owner: "",
      })
    }
  }, [mode, risk, reset])

  async function onSubmit(values: FormValues) {
    const payload = {
      accountId,
      description: values.description,
      severity: values.severity,
      mitigationPlan: values.mitigationPlan || undefined,
      owner: values.owner || undefined,
    }

    const result =
      mode === "create"
        ? await createRisk({ ...payload, mspId })
        : await updateRisk({ ...payload, riskId: risk!.id })

    if (!result.success) {
      onError(result.error)
      return
    }
    reset()
    onOpenChange(false)
  }

  const currentSeverity = watch("severity")

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
          <SheetTitle>{mode === "create" ? "Add Risk" : "Edit Risk"}</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          {/* Description */}
          <div className="space-y-1">
            <Label htmlFor="risk-desc">Description *</Label>
            <Textarea
              id="risk-desc"
              {...register("description")}
              placeholder="Describe the risk…"
              className="min-h-20"
            />
            {errors.description && (
              <p className="text-xs text-destructive">{errors.description.message}</p>
            )}
          </div>

          {/* Severity */}
          <div className="space-y-1">
            <Label>Severity</Label>
            <Select
              value={currentSeverity}
              onValueChange={(v) => setValue("severity", v as RiskSeverity)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(RiskSeverity).map((s) => (
                  <SelectItem key={s} value={s}>
                    {SEVERITY_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Mitigation Plan */}
          <div className="space-y-1">
            <Label htmlFor="risk-mitigation">Mitigation Plan</Label>
            <Textarea
              id="risk-mitigation"
              {...register("mitigationPlan")}
              placeholder="How will this risk be addressed?"
              className="min-h-16"
            />
          </div>

          {/* Owner */}
          <div className="space-y-1">
            <Label htmlFor="risk-owner">Owner</Label>
            <Input
              id="risk-owner"
              {...register("owner")}
              placeholder="e.g. Jane Smith or IT Team"
            />
          </div>

          <SheetFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : mode === "create" ? "Add Risk" : "Save Changes"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
