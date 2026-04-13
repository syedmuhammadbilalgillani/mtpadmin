"use client"

import { requestJson } from "@/lib/request"

export type PostFeatureRow = {
  id: number
  startDate: string
  endDate: string
  isActive: boolean
  paymentId?: string | null
  plan: { id: number; name: string; durationDays: number; price: number } | null
}

export async function listPostFeatures(postId: number) {
  return requestJson<PostFeatureRow[]>(`/api/server/post/${postId}/features`)
}

export async function createPostFeature(
  postId: number,
  body: { planId: number; startDate?: string; endDate?: string; paymentId?: string },
) {
  return requestJson<PostFeatureRow | undefined>(`/api/server/post/${postId}/features`, {
    method: "POST",
    body: JSON.stringify(body),
  })
}

export async function updatePostFeature(
  postId: number,
  featureId: number,
  body: Partial<{ planId: number; startDate: string; endDate: string; isActive: boolean; paymentId: string }>,
) {
  return requestJson<PostFeatureRow | undefined>(`/api/server/post/${postId}/features/${featureId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  })
}

export async function deletePostFeature(postId: number, featureId: number) {
  await requestJson(`/api/server/post/${postId}/features/${featureId}`, { method: "DELETE" })
}