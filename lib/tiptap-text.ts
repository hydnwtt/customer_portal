/**
 * Minimal helpers for round-tripping plain text through Tiptap-compatible JSON.
 * Enables plain textarea editing while keeping the DB schema forward-compatible
 * with a full Tiptap editor when one is added later.
 */

interface TiptapDoc {
  type: "doc"
  content: Array<{
    type: "paragraph"
    content?: Array<{ type: "text"; text: string }>
  }>
}

// Prisma's InputJsonValue requires index signature compatibility — cast at call site with `as object`
export function textToTiptapJson(text: string): Record<string, unknown> {
  const paragraphs = (text || "").split("\n").map((line) => ({
    type: "paragraph" as const,
    ...(line ? { content: [{ type: "text" as const, text: line }] } : {}),
  }))
  return { type: "doc", content: paragraphs.length > 0 ? paragraphs : [{ type: "paragraph" }] }
}

export function tiptapJsonToText(json: unknown): string {
  if (!json || typeof json !== "object") return ""
  const doc = json as TiptapDoc
  if (!Array.isArray(doc.content)) return ""
  return doc.content
    .map((node) => node.content?.map((n) => n.text || "").join("") || "")
    .join("\n")
    .trim()
}
