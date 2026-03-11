import { db } from "@/lib/db"

interface WriteAuditLogParams {
  accountId?: string
  userId?: string
  entityType: string
  entityId?: string
  field: string
  oldValue?: string | null
  newValue?: string | null
}

export async function writeAuditLog(params: WriteAuditLogParams): Promise<void> {
  await db.auditLog.create({
    data: {
      accountId: params.accountId ?? null,
      userId: params.userId ?? null,
      entityType: params.entityType,
      entityId: params.entityId ?? "",
      field: params.field,
      oldValue: params.oldValue ?? null,
      newValue: params.newValue ?? null,
    },
  })
}
