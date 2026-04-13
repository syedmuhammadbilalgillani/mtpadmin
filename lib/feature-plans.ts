"use client"

import { requestJson } from "@/lib/request"

export type FeaturePlanRow = {
  id: number
  name: string
  durationDays: number
  price: number
  isActive: boolean
}

export type CreateFeaturePlanInput = {
  name: string
  durationDays: number
  price: number
  isActive?: boolean
}

export type UpdateFeaturePlanInput = Partial<CreateFeaturePlanInput>

function normalizeList(raw: unknown): FeaturePlanRow[] {
  if (Array.isArray(raw)) return raw as FeaturePlanRow[]
  if (raw && typeof raw === "object" && "data" in raw && Array.isArray((raw as { data: unknown }).data)) {
    return (raw as { data: FeaturePlanRow[] }).data
  }
  return []
}

export async function listFeaturePlans(): Promise<FeaturePlanRow[]> {
  const res = await requestJson<unknown>("/api/server/feature-plan")
  return normalizeList(res)
}

export async function getFeaturePlan(id: number): Promise<FeaturePlanRow> {
  return requestJson<FeaturePlanRow>(`/api/server/feature-plan/${id}`)
}

export async function createFeaturePlan(input: CreateFeaturePlanInput): Promise<FeaturePlanRow> {
  return requestJson<FeaturePlanRow>("/api/server/feature-plan", {
    method: "POST",
    body: JSON.stringify(input),
  })
}

export async function updateFeaturePlan(id: number, input: UpdateFeaturePlanInput): Promise<FeaturePlanRow> {
  return requestJson<FeaturePlanRow>(`/api/server/feature-plan/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  })
}

export async function deleteFeaturePlan(id: number): Promise<void> {
  await requestJson(`/api/server/feature-plan/${id}`, { method: "DELETE" })
}