"use client"

import { useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { updateAccountConfig } from "@/app/(admin)/admin/accounts/[id]/config/actions"
import type { AccountConfig } from "@/lib/account-config"

const schema = z.object({
  logoUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Must be a hex color").optional().or(z.literal("")),
  enableRoiCalculator: z.boolean(),
  enableHelpfulLinks: z.boolean(),
  enableTimeline: z.boolean(),
  enableStakeholders: z.boolean(),
  enableSuccessMetrics: z.boolean(),
  enableWelcomePage: z.boolean(),
  enableCalcSpeedOfService: z.boolean(),
  enableCalcLossPrevention: z.boolean(),
  enableCalcLaborOptimization: z.boolean(),
  enableCalcMultiSiteTCO: z.boolean(),
  enableCalcDMTimeSavings: z.boolean(),
})

type FormValues = z.infer<typeof schema>

interface HubConfigFormProps {
  accountId: string
  logoUrl: string | null
  primaryColor: string | null
  config: AccountConfig
}

const TOGGLES: { key: keyof AccountConfig; label: string; description: string }[] = [
  { key: "enableWelcomePage", label: "Welcome Page", description: "Show the welcome/overview page to customers" },
  { key: "enableSuccessMetrics", label: "Success Metrics", description: "Display success metrics and KPIs" },
  { key: "enableTimeline", label: "Timeline", description: "Show project timeline and phases" },
  { key: "enableHelpfulLinks", label: "Helpful Links", description: "Display curated resource links" },
  { key: "enableStakeholders", label: "Stakeholders", description: "Show stakeholder directory" },
  { key: "enableRoiCalculator", label: "ROI Calculator", description: "Enable the ROI calculator tool" },
]

const CALC_TOGGLES: { key: keyof AccountConfig; label: string }[] = [
  { key: "enableCalcSpeedOfService", label: "Speed of Service" },
  { key: "enableCalcLossPrevention", label: "Loss Prevention" },
  { key: "enableCalcLaborOptimization", label: "Labor Optimization" },
  { key: "enableCalcMultiSiteTCO", label: "Multi-Site TCO" },
  { key: "enableCalcDMTimeSavings", label: "DM Time Savings" },
]

export function HubConfigForm({ accountId, logoUrl, primaryColor, config }: HubConfigFormProps) {
  const [serverError, setServerError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      logoUrl: logoUrl ?? "",
      primaryColor: primaryColor ?? "",
      ...config,
    },
  })

  const logoUrlValue = watch("logoUrl")

  async function onSubmit(values: FormValues) {
    setServerError(null)
    const result = await updateAccountConfig({
      accountId,
      logoUrl: values.logoUrl,
      primaryColor: values.primaryColor,
      enableRoiCalculator: values.enableRoiCalculator,
      enableHelpfulLinks: values.enableHelpfulLinks,
      enableTimeline: values.enableTimeline,
      enableStakeholders: values.enableStakeholders,
      enableSuccessMetrics: values.enableSuccessMetrics,
      enableWelcomePage: values.enableWelcomePage,
      enableCalcSpeedOfService: values.enableCalcSpeedOfService,
      enableCalcLossPrevention: values.enableCalcLossPrevention,
      enableCalcLaborOptimization: values.enableCalcLaborOptimization,
      enableCalcMultiSiteTCO: values.enableCalcMultiSiteTCO,
      enableCalcDMTimeSavings: values.enableCalcDMTimeSavings,
    })
    if (!result.success) {
      setServerError(result.error)
      return
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-lg space-y-6">
      {/* Branding */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold">Branding</h3>

        <div className="space-y-1">
          <Label htmlFor="cfg-logo">Logo URL</Label>
          <Input id="cfg-logo" type="url" {...register("logoUrl")} placeholder="https://..." />
          {errors.logoUrl && <p className="text-xs text-destructive">{errors.logoUrl.message}</p>}
          {logoUrlValue && (
            <div className="mt-2 h-12 w-32 relative">
              <Image
                src={logoUrlValue}
                alt="Logo preview"
                fill
                className="object-contain"
                unoptimized
              />
            </div>
          )}
        </div>

        <div className="space-y-1">
          <Label htmlFor="cfg-color">Primary Color</Label>
          <div className="flex gap-2">
            <Input
              id="cfg-color"
              type="color"
              {...register("primaryColor")}
              className="w-12 cursor-pointer px-1 py-0.5"
            />
            <Input
              {...register("primaryColor")}
              placeholder="#000000"
              className="font-mono"
            />
          </div>
          {errors.primaryColor && (
            <p className="text-xs text-destructive">{errors.primaryColor.message}</p>
          )}
        </div>
      </div>

      <Separator />

      {/* Feature Toggles */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold">Feature Flags</h3>
        <div className="space-y-3">
          {TOGGLES.map(({ key, label, description }) => (
            <div key={key} className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">{description}</p>
              </div>
              <Controller
                control={control}
                name={key}
                render={({ field }) => (
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </div>
          ))}
        </div>

        {/* Per-calculator toggles — visible only when ROI Calculator is enabled */}
        {watch("enableRoiCalculator") && (
          <div className="ml-4 mt-2 rounded-lg border border-border/60 bg-muted/30 p-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">ROI Calculator Tabs</p>
            {CALC_TOGGLES.map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between gap-4">
                <p className="text-sm">{label}</p>
                <Controller
                  control={control}
                  name={key}
                  render={({ field }) => (
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {serverError && <p className="text-sm text-destructive">{serverError}</p>}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isSubmitting || !isDirty}>
          {isSubmitting ? "Saving..." : "Save Changes"}
        </Button>
        {saved && <p className="text-sm text-green-600">Saved!</p>}
      </div>
    </form>
  )
}
