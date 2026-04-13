"use client"

import { requestJson } from "@/lib/request"

export type AdminState = {
  id: string
  name: string
  country: string
  latitude?: number | null
  longitude?: number | null
}

export type CreateStateInput = {
  name: string
  country: string
  latitude?: number
  longitude?: number
}

export type UpdateStateInput = Partial<CreateStateInput>

export type BulkInsertStatesInput = {
  ignoreDuplicates?: boolean
  items: Array<CreateStateInput>
}

function normalizeList(raw: unknown): AdminState[] {
  if (Array.isArray(raw)) return raw as AdminState[]
  if (raw && typeof raw === "object" && "data" in raw && Array.isArray((raw as any).data)) {
    return (raw as any).data as AdminState[]
  }
  return []
}

export async function listStates(params?: { q?: string; country?: string }): Promise<AdminState[]> {
  const qs = new URLSearchParams()
  if (params?.q?.trim()) qs.set("q", params.q.trim())
  if (params?.country?.trim()) qs.set("country", params.country.trim())
  const url = qs.toString() ? `/api/server/state?${qs}` : "/api/server/state"
  const res = await requestJson<unknown>(url)
  return normalizeList(res)
}

export async function getState(id: string): Promise<AdminState> {
  return requestJson<AdminState>(`/api/server/state/${id}`)
}

export async function createState(input: CreateStateInput): Promise<AdminState> {
  return requestJson<AdminState>("/api/server/state", {
    method: "POST",
    body: JSON.stringify(input),
  })
}

export async function updateState(id: string, input: UpdateStateInput): Promise<AdminState> {
  return requestJson<AdminState>(`/api/server/state/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  })
}

export async function deleteState(id: string): Promise<void> {
  await requestJson(`/api/server/state/${id}`, { method: "DELETE" })
}

export async function bulkInsertStates(input: BulkInsertStatesInput): Promise<{ ok: true; inserted?: number; skipped?: number }> {
  return requestJson(`/api/server/state/bulk`, {
    method: "POST",
    body: JSON.stringify(input),
  })
}