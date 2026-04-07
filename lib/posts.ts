"use client"

import { requestJson } from "@/lib/request"

export type AdminPostStatus = "draft" | "published" | "sold"
export type AdminListingType = "buy" | "sell"

export type AdminPostFieldValue = {
  id?: number
  fieldId: number
  value: string
  unit?: string | null
}

export type AdminPost = {
  id: number
  title: string
  shortDescription: string
  price: number
  labReportUrl?: string | null
  status: AdminPostStatus
  listingType: AdminListingType
  images: string[]
  createdAt: string
  updatedAt: string
  categoryId?: { id: number; name: string } | number
  locationId?: { id: string; name: string } | string
  fieldValues?: Array<{
    id: number
    value: string
    unit?: string | null
    field: { id: number; name: string; key: string; fieldType: string; required: boolean; order: number }
  }>
}

export type PostListResponse = {
  data: AdminPost[]
  meta?: { page: number; pageSize: number; total: number }
}

export type CreatePostInput = {
  title: string
  shortDescription: string
  categoryId: number
  locationId: string
  price: number
  labReportUrl?: string
  status?: AdminPostStatus
  listingType?: AdminListingType
  images?: string[]
  fieldValues?: AdminPostFieldValue[]
}

export type UpdatePostInput = Partial<CreatePostInput>

export async function listPosts(params?: {
  categoryId?: number
  status?: AdminPostStatus
  listingType?: AdminListingType
  locationId?: string
  q?: string
  page?: number
  pageSize?: number
}): Promise<PostListResponse> {
  const qs = new URLSearchParams()
  if (params?.categoryId) qs.set("categoryId", String(params.categoryId))
  if (params?.status) qs.set("status", params.status)
  if (params?.listingType) qs.set("listingType", params.listingType)
  if (params?.locationId) qs.set("locationId", params.locationId)
  if (params?.q) qs.set("q", params.q)
  if (params?.page) qs.set("page", String(params.page))
  if (params?.pageSize) qs.set("pageSize", String(params.pageSize))

  const url = qs.toString() ? `/api/server/post?${qs}` : "/api/server/post"
  const res = await requestJson<unknown>(url)
  if (typeof res === "object" && res && "data" in (res as Record<string, unknown>)) {
    return res as PostListResponse
  }
  return { data: Array.isArray(res) ? (res as AdminPost[]) : [] }
}

export async function getPost(id: number): Promise<AdminPost> {
  return requestJson<AdminPost>(`/api/server/post/${id}`)
}

export async function createPost(input: CreatePostInput): Promise<AdminPost> {
  return requestJson<AdminPost>("/api/server/post", { method: "POST", body: JSON.stringify(input) })
}

export async function updatePost(id: number, input: UpdatePostInput): Promise<AdminPost> {
  return requestJson<AdminPost>(`/api/server/post/${id}`, { method: "PATCH", body: JSON.stringify(input) })
}

export async function deletePost(id: number): Promise<void> {
  await requestJson(`/api/server/post/${id}`, { method: "DELETE" })
}

