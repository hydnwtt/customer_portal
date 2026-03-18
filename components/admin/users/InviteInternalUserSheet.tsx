"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { UserRole } from "@prisma/client"
import { CopyIcon, CheckIcon } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
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
import { inviteInternalUser } from "@/app/(admin)/admin/users/actions"

const schema = z.object({
  name: z.string().min(1, "Required").max(100),
  email: z.string().email("Must be a valid email"),
  role: z.enum([UserRole.INTERNAL_ADMIN, UserRole.INTERNAL_MEMBER]),
})

type FormValues = z.infer<typeof schema>

interface InviteInternalUserSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function InviteInternalUserSheet({ open, onOpenChange }: InviteInternalUserSheetProps) {
  const [serverError, setServerError] = useState<string | null>(null)
  const [tempPassword, setTempPassword] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { role: UserRole.INTERNAL_MEMBER },
  })

  async function onSubmit(values: FormValues) {
    setServerError(null)
    const result = await inviteInternalUser(values)
    if (!result.success) {
      setServerError(result.error)
      return
    }
    reset()
    onOpenChange(false)
    setTempPassword(result.tempPassword)
  }

  async function handleCopy() {
    if (!tempPassword) return
    await navigator.clipboard.writeText(tempPassword)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <Sheet
        open={open}
        onOpenChange={(v: boolean) => {
          if (!v) {
            reset()
            setServerError(null)
          }
          onOpenChange(v)
        }}
      >
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Invite Team Member</SheetTitle>
          </SheetHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <div className="space-y-1">
              <Label htmlFor="int-name">Full Name *</Label>
              <Input id="int-name" {...register("name")} placeholder="Jane Smith" />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-1">
              <Label htmlFor="int-email">Email *</Label>
              <Input id="int-email" type="email" {...register("email")} placeholder="jane@pilothub.dev" />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-1">
              <Label>Role *</Label>
              <Select
                defaultValue={UserRole.INTERNAL_MEMBER}
                onValueChange={(v: string | null) =>
                  setValue(
                    "role",
                    (v ?? UserRole.INTERNAL_MEMBER) as typeof UserRole.INTERNAL_ADMIN | typeof UserRole.INTERNAL_MEMBER
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UserRole.INTERNAL_MEMBER}>Member</SelectItem>
                  <SelectItem value={UserRole.INTERNAL_ADMIN}>Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {serverError && <p className="text-sm text-destructive">{serverError}</p>}

            <SheetFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Inviting..." : "Invite"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      {/* Temp password dialog — non-dismissible */}
      <Dialog open={tempPassword !== null} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-sm" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Temporary Password</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Share this securely with the new team member. It will only be shown once.
          </p>
          <div className="flex items-center gap-2 rounded-md border bg-muted px-3 py-2 font-mono text-sm">
            <span className="flex-1 select-all">{tempPassword}</span>
            <Button variant="ghost" size="icon-sm" onClick={handleCopy}>
              {copied ? <CheckIcon className="size-4 text-green-600" /> : <CopyIcon className="size-4" />}
            </Button>
          </div>
          <DialogFooter>
            <Button onClick={() => setTempPassword(null)}>I&apos;ve saved it</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
