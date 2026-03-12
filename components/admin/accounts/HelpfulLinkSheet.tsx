"use client"

import { useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
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
import { Switch } from "@/components/ui/switch"
import { createLink, updateLink } from "@/app/(admin)/admin/accounts/[id]/links/actions"

const schema = z.object({
  title: z.string().min(1, "Required").max(200),
  url: z.string().url("Must be a valid URL"),
  category: z.string().min(1, "Required").max(100),
  description: z.string().max(500).optional(),
  isRequiredReading: z.boolean(),
})

type FormValues = z.infer<typeof schema>

interface SerializedLink {
  id: string
  title: string
  url: string
  category: string
  description: string | null
  isRequiredReading: boolean
}

interface HelpfulLinkSheetProps {
  mode: "create" | "edit"
  open: boolean
  onOpenChange: (open: boolean) => void
  accountId: string
  link?: SerializedLink
  onError: (error: string) => void
}

export function HelpfulLinkSheet({
  mode,
  open,
  onOpenChange,
  accountId,
  link,
  onError,
}: HelpfulLinkSheetProps) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      url: "",
      category: "Documentation",
      description: "",
      isRequiredReading: false,
    },
  })

  useEffect(() => {
    if (mode === "edit" && link) {
      reset({
        title: link.title,
        url: link.url,
        category: link.category,
        description: link.description ?? "",
        isRequiredReading: link.isRequiredReading,
      })
    } else if (mode === "create") {
      reset({
        title: "",
        url: "",
        category: "Documentation",
        description: "",
        isRequiredReading: false,
      })
    }
  }, [mode, link, reset])

  async function onSubmit(values: FormValues) {
    const payload = {
      accountId,
      title: values.title,
      url: values.url,
      category: values.category,
      description: values.description || undefined,
      isRequiredReading: values.isRequiredReading,
    }

    const result =
      mode === "create"
        ? await createLink(payload)
        : await updateLink({ ...payload, linkId: link!.id })

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
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{mode === "create" ? "Add Link" : "Edit Link"}</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          {/* Title */}
          <div className="space-y-1">
            <Label htmlFor="link-title">Title *</Label>
            <Input
              id="link-title"
              {...register("title")}
              placeholder="e.g. Onboarding Guide"
            />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title.message}</p>
            )}
          </div>

          {/* URL */}
          <div className="space-y-1">
            <Label htmlFor="link-url">URL *</Label>
            <Input
              id="link-url"
              type="url"
              {...register("url")}
              placeholder="https://docs.example.com/guide"
            />
            {errors.url && (
              <p className="text-xs text-destructive">{errors.url.message}</p>
            )}
          </div>

          {/* Category */}
          <div className="space-y-1">
            <Label htmlFor="link-category">Category</Label>
            <Input
              id="link-category"
              {...register("category")}
              placeholder="Documentation"
            />
            {errors.category && (
              <p className="text-xs text-destructive">{errors.category.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1">
            <Label htmlFor="link-desc">Description</Label>
            <Textarea
              id="link-desc"
              {...register("description")}
              placeholder="Optional short description"
              className="min-h-16"
            />
          </div>

          {/* Required Reading toggle */}
          <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
            <div>
              <p className="text-sm font-medium">Required Reading</p>
              <p className="text-xs text-muted-foreground">
                Show on the welcome page as required reading
              </p>
            </div>
            <Controller
              control={control}
              name="isRequiredReading"
              render={({ field }) => (
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          </div>

          <SheetFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : mode === "create" ? "Add Link" : "Save Changes"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
