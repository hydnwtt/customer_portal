"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { UserRole } from "@prisma/client"
import { CopyIcon, CheckIcon, MailCheckIcon } from "lucide-react"
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
import { inviteCustomerUser } from "@/app/(admin)/admin/accounts/[id]/users/actions"

const schema = z.object({
  name: z.string().min(1, "Required").max(100),
  email: z.string().email("Must be a valid email"),
  role: z.enum([UserRole.CUSTOMER_ADMIN, UserRole.CUSTOMER_VIEWER]),
})

type FormValues = z.infer<typeof schema>

interface InviteUserSheetProps {
  accountId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function InviteUserSheet({ accountId, open, onOpenChange }: InviteUserSheetProps) {
  const [serverError, setServerError] = useState<string | null>(null)
  const [tempPassword, setTempPassword] = useState<string | null>(null)
  const [invitedEmail, setInvitedEmail] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { role: UserRole.CUSTOMER_VIEWER },
  })

  async function onSubmit(values: FormValues) {
    setServerError(null)
    const result = await inviteCustomerUser({ accountId, ...values })
    if (!result.success) {
      setServerError(result.error)
      return
    }
    reset()
    onOpenChange(false)
    if (result.tempPassword) {
      // Email failed — fall back to showing temp password
      setTempPassword(result.tempPassword)
    } else {
      // Email sent successfully
      setInvitedEmail(values.email)
    }
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
            <SheetTitle>Invite User</SheetTitle>
          </SheetHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <div className="space-y-1">
              <Label htmlFor="inv-name">Full Name *</Label>
              <Input id="inv-name" {...register("name")} placeholder="Jane Smith" />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-1">
              <Label htmlFor="inv-email">Email *</Label>
              <Input id="inv-email" type="email" {...register("email")} placeholder="jane@acme.com" />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-1">
              <Label>Role *</Label>
              <Select
                defaultValue={UserRole.CUSTOMER_VIEWER}
                onValueChange={(v: string | null) =>
                  setValue("role", (v ?? UserRole.CUSTOMER_VIEWER) as typeof UserRole.CUSTOMER_ADMIN | typeof UserRole.CUSTOMER_VIEWER)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UserRole.CUSTOMER_VIEWER}>Viewer</SelectItem>
                  <SelectItem value={UserRole.CUSTOMER_ADMIN}>Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {serverError && <p className="text-sm text-destructive">{serverError}</p>}

            <SheetFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Inviting..." : "Invite User"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      {/* Invite sent confirmation dialog */}
      <Dialog open={invitedEmail !== null} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-sm" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MailCheckIcon className="size-5 text-green-600" />
              Invite Sent
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            An invite email has been sent to{" "}
            <span className="font-medium text-foreground">{invitedEmail}</span>. They&apos;ll
            receive a link to set their password and access the portal.
          </p>
          <DialogFooter>
            <Button onClick={() => setInvitedEmail(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Temp password fallback dialog (shown if email sending fails) — non-dismissible */}
      <Dialog open={tempPassword !== null} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-sm" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Temporary Password</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            The invite email couldn&apos;t be sent. Share this temporary password securely with
            the new user — it will only be shown once.
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
