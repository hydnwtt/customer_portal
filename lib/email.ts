import { Resend } from "resend"

function getResend() {
  const key = process.env.RESEND_API_KEY
  if (!key) throw new Error("RESEND_API_KEY is not configured")
  return new Resend(key)
}

function getFrom() {
  return `${process.env.RESEND_FROM_NAME ?? "Pilot Hub"} <${process.env.RESEND_FROM_EMAIL ?? "noreply@example.com"}>`
}

interface SendInviteEmailParams {
  to: string
  name: string
  accountName: string
  inviteUrl: string
}

export async function sendInviteEmail({
  to,
  name,
  accountName,
  inviteUrl,
}: SendInviteEmailParams): Promise<{ success: boolean }> {
  const firstName = name.split(" ")[0]

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>You've been invited</title>
</head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:8px;border:1px solid #e5e7eb;padding:40px 32px;">
          <tr>
            <td>
              <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">
                Pilot Hub
              </p>
              <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#111827;line-height:1.3;">
                You've been invited to ${accountName}'s pilot
              </h1>
              <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">
                Hi ${firstName},<br /><br />
                Your team has set up a Pilot Hub to keep everyone aligned during your pilot. Click the button below to set your password and access your hub.
              </p>
              <table cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="border-radius:6px;background:#2563eb;">
                    <a href="${inviteUrl}" target="_blank"
                      style="display:inline-block;padding:12px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:6px;">
                      Set up your account →
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 24px;font-size:13px;color:#6b7280;line-height:1.5;">
                This link expires in 48 hours. If you weren't expecting this invitation, you can safely ignore this email.
              </p>
              <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 20px;" />
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                If the button above doesn't work, copy and paste this link into your browser:<br />
                <a href="${inviteUrl}" style="color:#2563eb;word-break:break-all;">${inviteUrl}</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  try {
    const { error } = await getResend().emails.send({
      from: getFrom(),
      to,
      subject: `You've been invited to ${accountName}'s Pilot Hub`,
      html,
    })
    if (error) {
      console.error("[email] Resend error:", error)
      return { success: false }
    }
    return { success: true }
  } catch (err) {
    console.error("[email] Unexpected error:", err)
    return { success: false }
  }
}

// ── Internal team invite ──────────────────────────────────────────────────────

interface SendTeamInviteEmailParams {
  to: string
  name: string
  inviteUrl: string
}

export async function sendTeamInviteEmail({
  to,
  name,
  inviteUrl,
}: SendTeamInviteEmailParams): Promise<{ success: boolean }> {
  const firstName = name.split(" ")[0]
  const appName = process.env.NEXT_PUBLIC_COMPANY_NAME ?? "Pilot Hub"

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>You've been added to ${appName}</title>
</head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:8px;border:1px solid #e5e7eb;padding:40px 32px;">
          <tr>
            <td>
              <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">
                ${appName}
              </p>
              <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#111827;line-height:1.3;">
                You've been added to the ${appName} team
              </h1>
              <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">
                Hi ${firstName},<br /><br />
                You've been invited to join the ${appName} admin team. Click the button below to set your password and get started.
              </p>
              <table cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="border-radius:6px;background:#2563eb;">
                    <a href="${inviteUrl}" target="_blank"
                      style="display:inline-block;padding:12px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:6px;">
                      Set up your account →
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 24px;font-size:13px;color:#6b7280;line-height:1.5;">
                This link expires in 48 hours. If you weren't expecting this invitation, you can safely ignore this email.
              </p>
              <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 20px;" />
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                If the button above doesn't work, copy and paste this link into your browser:<br />
                <a href="${inviteUrl}" style="color:#2563eb;word-break:break-all;">${inviteUrl}</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  try {
    const { error } = await getResend().emails.send({
      from: getFrom(),
      to,
      subject: `You've been added to the ${appName} team`,
      html,
    })
    if (error) {
      console.error("[email] Resend error (team invite):", error)
      return { success: false }
    }
    return { success: true }
  } catch (err) {
    console.error("[email] Unexpected error (team invite):", err)
    return { success: false }
  }
}
