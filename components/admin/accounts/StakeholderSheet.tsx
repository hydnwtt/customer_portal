"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { InvolvementLevel, StakeholderCompany } from "@prisma/client"
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
  createStakeholder,
  updateStakeholder,
} from "@/app/(admin)/admin/accounts/[id]/stakeholders/actions"

const schema = z.object({
  name: z.string().min(1, "Required").max(200),
  email: z.string().email("Must be a valid email"),
  company: z.nativeEnum(StakeholderCompany),
  title: z.string().max(200).optional(),
  phone: z.string().max(50).optional(),
  involvementLevel: z.nativeEnum(InvolvementLevel),
  lastEngagedAt: z.string().optional(),
  notes: z.string().max(1000).optional(),
})

type FormValues = z.infer<typeof schema>

interface SerializedStakeholder {
  id: string
  name: string
  company: StakeholderCompany
  title: string | null
  email: string
  phone: string | null
  involvementLevel: InvolvementLevel
  lastEngagedAt: string | null
  notes: string | null
}

interface StakeholderSheetProps {
  mode: "create" | "edit"
  open: boolean
  onOpenChange: (open: boolean) => void
  accountId: string
  stakeholder?: SerializedStakeholder
  onError: (error: string) => void
}

const COMPANY_LABELS: Record<StakeholderCompany, string> = {
  CUSTOMER: "Customer",
  INTERNAL: "Internal",
}

const INVOLVEMENT_LABELS: Record<InvolvementLevel, string> = {
  DECISION_MAKER: "Decision Maker",
  CHAMPION: "Champion",
  INFLUENCER: "Influencer",
  INFORMED: "Informed",
}

function toDateInput(iso: string | null | undefined): string {
  if (!iso) return ""
  return iso.slice(0, 10)
}

export function StakeholderSheet({
  mode,
  open,
  onOpenChange,
  accountId,
  stakeholder,
  onError,
}: StakeholderSheetProps) {
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
      email: "",
      company: StakeholderCompany.CUSTOMER,
      title: "",
      phone: "",
      involvementLevel: InvolvementLevel.INFORMED,
      lastEngagedAt: "",
      notes: "",
    },
  })

  useEffect(() => {
    if (mode === "edit" && stakeholder) {
      reset({
        name: stakeholder.name,
        email: stakeholder.email,
        company: stakeholder.company,
        title: stakeholder.title ?? "",
        phone: stakeholder.phone ?? "",
        involvementLevel: stakeholder.involvementLevel,
        lastEngagedAt: toDateInput(stakeholder.lastEngagedAt),
        notes: stakeholder.notes ?? "",
      })
    } else if (mode === "create") {
      reset({
        name: "",
        email: "",
        company: StakeholderCompany.CUSTOMER,
        title: "",
        phone: "",
        involvementLevel: InvolvementLevel.INFORMED,
        lastEngagedAt: "",
        notes: "",
      })
    }
  }, [mode, stakeholder, reset])

  const currentCompany = watch("company")
  const currentInvolvement = watch("involvementLevel")

  async function onSubmit(values: FormValues) {
    const payload = {
      accountId,
      name: values.name,
      email: values.email,
      company: values.company,
      title: values.title || undefined,
      phone: values.phone || undefined,
      involvementLevel: values.involvementLevel,
      lastEngagedAt: values.lastEngagedAt || undefined,
      notes: values.notes || undefined,
    }

    const result =
      mode === "create"
        ? await createStakeholder(payload)
        : await updateStakeholder({ ...payload, stakeholderId: stakeholder!.id })

    if (!result.success) {
      onError(result.error)
      return
    }
    reset()
    onOpenChange(false)
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        if (!v) reset()
        onOpenChange(v)
      }}
    >
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {mode === "create" ? "Add Stakeholder" : "Edit Stakeholder"}
          </SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          {/* Name */}
          <div className="space-y-1">
            <Label htmlFor="sh-name">Name *</Label>
            <Input id="sh-name" {...register("name")} placeholder="e.g. Jane Smith" />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-1">
            <Label htmlFor="sh-email">Email *</Label>
            <Input
              id="sh-email"
              type="email"
              {...register("email")}
              placeholder="jane@example.com"
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          {/* Company + Involvement side-by-side */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Company</Label>
              <Select
                value={currentCompany}
                onValueChange={(v: string | null) =>
                  setValue("company", (v ?? StakeholderCompany.CUSTOMER) as StakeholderCompany)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(StakeholderCompany).map((c) => (
                    <SelectItem key={c} value={c}>
                      {COMPANY_LABELS[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Involvement</Label>
              <Select
                value={currentInvolvement}
                onValueChange={(v: string | null) =>
                  setValue(
                    "involvementLevel",
                    (v ?? InvolvementLevel.INFORMED) as InvolvementLevel
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(InvolvementLevel).map((l) => (
                    <SelectItem key={l} value={l}>
                      {INVOLVEMENT_LABELS[l]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-1">
            <Label htmlFor="sh-title">Title</Label>
            <Input
              id="sh-title"
              {...register("title")}
              placeholder="e.g. VP of Engineering"
            />
          </div>

          {/* Phone */}
          <div className="space-y-1">
            <Label htmlFor="sh-phone">Phone</Label>
            <Input
              id="sh-phone"
              {...register("phone")}
              placeholder="+1 (555) 000-0000"
            />
          </div>

          {/* Last Engaged */}
          <div className="space-y-1">
            <Label htmlFor="sh-last-engaged">Last Engaged</Label>
            <Input id="sh-last-engaged" type="date" {...register("lastEngagedAt")} />
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <Label htmlFor="sh-notes">Notes</Label>
            <Textarea
              id="sh-notes"
              {...register("notes")}
              placeholder="Internal notes about this contact"
              className="min-h-20"
            />
          </div>

          <SheetFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? "Saving…"
                : mode === "create"
                ? "Add Stakeholder"
                : "Save Changes"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
