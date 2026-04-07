"use client"

export type ApiErrorPayload = {
  message?: string | string[]
  error?: string
  statusCode?: number
}

function extractMessage(payload: unknown): string | undefined {
  if (!payload || typeof payload !== "object") return undefined
  const p = payload as ApiErrorPayload
  if (typeof p.message === "string") return p.message
  if (Array.isArray(p.message)) return p.message.filter(Boolean).join(", ")
  return undefined
}

export async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const isFormData = typeof FormData !== "undefined" && init?.body instanceof FormData
  const headers = new Headers(init?.headers)
  if (!isFormData && !headers.has("content-type")) {
    headers.set("content-type", "application/json")
  }

  const res = await fetch(url, {
    ...init,
    headers,
    cache: "no-store",
  })

  const text = await res.text()
  const data = text ? (JSON.parse(text) as unknown) : {}

  if (!res.ok) {
    const message = extractMessage(data) ?? `Request failed (${res.status})`
    throw new Error(message)
  }

  return data as T
}

