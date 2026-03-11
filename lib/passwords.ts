import bcryptjs from "bcryptjs"

const CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%"

export function generateTempPassword(length = 12): string {
  let password = ""
  for (let i = 0; i < length; i++) {
    password += CHARSET[Math.floor(Math.random() * CHARSET.length)]
  }
  return password
}

export async function hashPassword(password: string): Promise<string> {
  return bcryptjs.hash(password, 12)
}
