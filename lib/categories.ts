"use client"

import { requestJson } from "@/lib/request"

export type AdminCategoryFieldType = "text" | "number" | "select" | "multi-select"

export type AdminCategoryField = {
  id: number
  name: string
  placeholder: string
  key: string
  fieldType: AdminCategoryFieldType
  options?: string[] | null
  unit?: string | null
  required: boolean
  order: number
}

export type AdminCategory = {
  id: number
  name: string
  description?: string | null
  iconImageUrl?: string | null
  backgroundImageUrl?: string | null
  postImages?: string[] | null
  fields?: AdminCategoryField[]
}

export type CreateCategoryFieldInput = {
  name: string
  placeholder: string
  key: string
  fieldType: AdminCategoryFieldType
  options?: string[]
  unit?: string
  required?: boolean
  order?: number
}

export type UpdateCategoryFieldInput = Partial<CreateCategoryFieldInput>

export async function listCategories(): Promise<AdminCategory[]> {
  const res = await requestJson<unknown>("/api/server/categories")
  return Array.isArray(res)
    ? (res as AdminCategory[])
    : typeof res === "object" && res && "data" in (res as Record<string, unknown>)
      ? (((res as { data?: unknown }).data as AdminCategory[]) ?? [])
      : []
}

export async function getCategory(categoryId: number): Promise<AdminCategory> {
  return requestJson<AdminCategory>(`/api/server/categories/${categoryId}`)
}

export async function deleteCategory(categoryId: number): Promise<void> {
  await requestJson(`/api/server/categories/${categoryId}`, { method: "DELETE" })
}

export async function getCategoryPostImages(categoryId: number): Promise<string[]> {
  const category = await getCategory(categoryId)
  return category.postImages ?? []
}

export async function uploadCategoryPostImages(categoryId: number, files: FileList | File[]) {
  const formData = new FormData()
  Array.from(files).forEach((file) => formData.append("postImages", file))
  await requestJson(`/api/server/categories/${categoryId}/with-files`, { method: "PATCH", body: formData })
}

export async function replaceCategoryPostImages(categoryId: number, postImages: string[]) {
  await requestJson(`/api/server/categories/${categoryId}`, {
    method: "PATCH",
    body: JSON.stringify({ postImages }),
  })
}

export async function deleteCategoryPostImage(categoryId: number, imageUrl: string) {
  const category = await getCategory(categoryId)
  const next = (category.postImages ?? []).filter((url) => url !== imageUrl)
  await replaceCategoryPostImages(categoryId, next)
}

export async function addCategoryField(
  categoryId: number,
  input: CreateCategoryFieldInput,
): Promise<AdminCategoryField> {
  return requestJson<AdminCategoryField>(`/api/server/categories/f/${categoryId}/fields`, {
    method: "POST",
    body: JSON.stringify(input),
  })
}

export async function updateCategoryField(
  fieldId: number,
  input: UpdateCategoryFieldInput,
): Promise<AdminCategoryField> {
  return requestJson<AdminCategoryField>(`/api/server/categories/fields/${fieldId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  })
}

export async function deleteCategoryField(fieldId: number): Promise<void> {
  await requestJson(`/api/server/categories/fields/${fieldId}`, { method: "DELETE" })
}

