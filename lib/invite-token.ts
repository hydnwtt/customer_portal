import crypto from "crypto"

interface InvitePayload {
  userId: string
  accountSlug: string
  exp: number // Unix timestamp (seconds)
}

const EXPIRY_HOURS = 48

function getSecret(): string {
  const secret = process.env.AUTH_SECRET
  if (!secret) throw new Error("AUTH_SECRET is not set")
  return secret
}

export function generateInviteToken(payload: Omit<InvitePayload, "exp">): string {
  const data: InvitePayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + EXPIRY_HOURS * 3600,
  }
  const encoded = Buffer.from(JSON.stringify(data)).toString("base64url")
  const sig = crypto
    .createHmac("sha256", getSecret())
    .update(encoded)
    .digest("base64url")
  return `${encoded}.${sig}`
}

export function verifyInviteToken(token: string): InvitePayload | null {
  const dotIndex = token.lastIndexOf(".")
  if (dotIndex === -1) return null

  const encoded = token.slice(0, dotIndex)
  const sig = token.slice(dotIndex + 1)

  const expected = crypto
    .createHmac("sha256", getSecret())
    .update(encoded)
    .digest("base64url")

  // Constant-time comparison to prevent timing attacks
  if (sig.length !== expected.length) return null
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null

  try {
    const payload = JSON.parse(
      Buffer.from(encoded, "base64url").toString()
    ) as InvitePayload
    if (payload.exp < Math.floor(Date.now() / 1000)) return null // expired
    return payload
  } catch {
    return null
  }
}
