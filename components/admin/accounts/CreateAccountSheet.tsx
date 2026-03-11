"use client"

import { useState, useEffect } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { PlusIcon, XIcon } from "lucide-react"
import { AccountStatus } from "@prisma/client"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createAccount, type CreateAccountInput } from "@/app/(admin)/admin/accounts/actions"
import { slugifyName } from "@/lib/utils"

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  slug: z.string().min(2, "Slug must be at least 2 characters").max(50).regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers, hyphens only"),
  logoUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  status: z.nativeEnum(AccountStatus),
  pilotStartDate: z.string().optional(),
  goNoGoDate: z.string().optional(),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Must be a hex color").optional().or(z.literal("")),
  siteNames: z.array(z.object({ value: z.string().min(1, "Required") })).max(20),
  aeUserId: z.string().optional(),
  csmUserId: z.string().optional(),
  ilUserId: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface InternalUser {
  id: string
  name: string
  email: string
}

interface CreateAccountSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  internalUsers: InternalUser[]
}

export function CreateAccountSheet({ open, onOpenChange, internalUsers }: CreateAccountSheetProps) {
  const [serverError, setServerError] = useState<string | null>(null)
  const [slugEdited, setSlugEdited] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      status: AccountStatus.ACTIVE_PILOT,
      siteNames: [],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: "siteNames" })

  const nameValue = watch("name")
  useEffect(() => {
    if (!slugEdited && nameValue) {
      setValue("slug", slugifyName(nameValue), { shouldValidate: false })
    }
  }, [nameValue, slugEdited, setValue])

  async function onSubmit(values: FormValues) {
    setServerError(null)
    const input: CreateAccountInput = {
      name: values.name,
      slug: values.slug,
      logoUrl: values.logoUrl,
      status: values.status,
      pilotStartDate: values.pilotStartDate,
      goNoGoDate: values.goNoGoDate,
      primaryColor: values.primaryColor,
      siteNames: values.siteNames.map((s) => s.value),
      aeUserId: values.aeUserId || undefined,
      csmUserId: values.csmUserId || undefined,
      ilUserId: values.ilUserId || undefined,
    }

    const result = await createAccount(input)
    if (!result.success) {
      setServerError(result.error)
      return
    }
    reset()
    setSlugEdited(false)
    onOpenChange(false)
  }

  function handleClose(v: boolean) {
    if (!v) {
      reset()
      setSlugEdited(false)
      setServerError(null)
    }
    onOpenChange(v)
  }

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className="overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>New Account</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          {/* Name + Slug */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="name">Account Name *</Label>
              <Input id="name" {...register("name")} placeholder="Acme Corporation" />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                {...register("slug", {
                  onChange: () => setSlugEdited(true),
                })}
                placeholder="acme-corp"
              />
              {errors.slug && <p className="text-xs text-destructive">{errors.slug.message}</p>}
            </div>
          </div>

          {/* Status */}
          <div className="space-y-1">
            <Label>Status *</Label>
            <Select
              defaultValue={AccountStatus.ACTIVE_PILOT}
              onValueChange={(v) => setValue("status", v as AccountStatus)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE_PILOT">Active Pilot</SelectItem>
                <SelectItem value="EVALUATION">Evaluation</SelectItem>
                <SelectItem value="CONVERTED">Converted</SelectItem>
                <SelectItem value="CHURNED">Churned</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="pilotStartDate">Pilot Start Date</Label>
              <Input id="pilotStartDate" type="date" {...register("pilotStartDate")} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="goNoGoDate">Go/No-Go Date</Label>
              <Input id="goNoGoDate" type="date" {...register("goNoGoDate")} />
            </div>
          </div>

          {/* Logo URL */}
          <div className="space-y-1">
            <Label htmlFor="logoUrl">Logo URL</Label>
            <Input id="logoUrl" type="url" {...register("logoUrl")} placeholder="https://..." />
            {errors.logoUrl && <p className="text-xs text-destructive">{errors.logoUrl.message}</p>}
          </div>

          {/* Primary Color */}
          <div className="space-y-1">
            <Label htmlFor="primaryColor">Primary Color</Label>
            <div className="flex gap-2">
              <Input id="primaryColor" type="color" {...register("primaryColor")} className="w-12 cursor-pointer px-1 py-0.5" />
              <Input {...register("primaryColor")} placeholder="#000000" className="font-mono" />
            </div>
            {errors.primaryColor && <p className="text-xs text-destructive">{errors.primaryColor.message}</p>}
          </div>

          {/* Team */}
          <div className="space-y-2">
            <Label>Internal Team</Label>
            {(["aeUserId", "csmUserId", "ilUserId"] as const).map((field, i) => (
              <div key={field} className="flex items-center gap-2">
                <span className="w-6 text-xs text-muted-foreground">{["AE", "CSM", "IL"][i]}</span>
                <Select onValueChange={(v: string | null) => setValue(field, v === "NONE" || v === null ? undefined : v)}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select user..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">None</SelectItem>
                    {internalUsers.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name} ({u.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>

          {/* Pilot Sites */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Pilot Sites</Label>
              {fields.length < 20 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  onClick={() => append({ value: "" })}
                >
                  <PlusIcon className="size-3" />
                  Add Site
                </Button>
              )}
            </div>
            {fields.map((field, idx) => (
              <div key={field.id} className="flex gap-2">
                <Input
                  {...register(`siteNames.${idx}.value`)}
                  placeholder={`Site ${idx + 1}`}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => remove(idx)}
                >
                  <XIcon className="size-4" />
                </Button>
              </div>
            ))}
          </div>

          {serverError && (
            <p className="text-sm text-destructive">{serverError}</p>
          )}

          <SheetFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => handleClose(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Account"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
