"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
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
import { updateAccount } from "@/app/(admin)/admin/accounts/actions"

const schema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers, hyphens only"),
  logoUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  status: z.nativeEnum(AccountStatus),
  pilotStartDate: z.string().optional(),
  goNoGoDate: z.string().optional(),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().or(z.literal("")),
})

type FormValues = z.infer<typeof schema>

export interface AccountForEdit {
  id: string
  name: string
  slug: string
  logoUrl: string | null
  status: AccountStatus
  pilotStartDate: string | null
  goNoGoDate: string | null
  primaryColor: string | null
}

interface EditAccountSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  account: AccountForEdit
}

export function EditAccountSheet({ open, onOpenChange, account }: EditAccountSheetProps) {
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: account.name,
      slug: account.slug,
      logoUrl: account.logoUrl ?? "",
      status: account.status,
      pilotStartDate: account.pilotStartDate?.slice(0, 10) ?? "",
      goNoGoDate: account.goNoGoDate?.slice(0, 10) ?? "",
      primaryColor: account.primaryColor ?? "",
    },
  })

  useEffect(() => {
    if (open) {
      reset({
        name: account.name,
        slug: account.slug,
        logoUrl: account.logoUrl ?? "",
        status: account.status,
        pilotStartDate: account.pilotStartDate?.slice(0, 10) ?? "",
        goNoGoDate: account.goNoGoDate?.slice(0, 10) ?? "",
        primaryColor: account.primaryColor ?? "",
      })
    }
  }, [open, account, reset])

  async function onSubmit(values: FormValues) {
    setServerError(null)
    const result = await updateAccount({ id: account.id, ...values })
    if (!result.success) {
      setServerError(result.error)
      return
    }
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Edit Account</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="edit-name">Account Name *</Label>
              <Input id="edit-name" {...register("name")} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-slug">Slug *</Label>
              <Input id="edit-slug" {...register("slug")} className="font-mono text-sm" />
              {errors.slug && <p className="text-xs text-destructive">{errors.slug.message}</p>}
            </div>
          </div>

          <div className="space-y-1">
            <Label>Status *</Label>
            <Select
              defaultValue={account.status}
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="edit-start">Pilot Start Date</Label>
              <Input id="edit-start" type="date" {...register("pilotStartDate")} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-gng">Go/No-Go Date</Label>
              <Input id="edit-gng" type="date" {...register("goNoGoDate")} />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="edit-logo">Logo URL</Label>
            <Input id="edit-logo" type="url" {...register("logoUrl")} placeholder="https://..." />
            {errors.logoUrl && <p className="text-xs text-destructive">{errors.logoUrl.message}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="edit-color">Primary Color</Label>
            <div className="flex gap-2">
              <Input id="edit-color" type="color" {...register("primaryColor")} className="w-12 cursor-pointer px-1 py-0.5" />
              <Input {...register("primaryColor")} placeholder="#000000" className="font-mono" />
            </div>
            {errors.primaryColor && <p className="text-xs text-destructive">{errors.primaryColor.message}</p>}
          </div>

          {serverError && <p className="text-sm text-destructive">{serverError}</p>}

          <SheetFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
