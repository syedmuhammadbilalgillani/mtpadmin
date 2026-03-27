import { NextRequest, NextResponse } from "next/server";
import {
  getAccessTokenOrResponse,
  proxyJsonRequest,
  proxyMultipartRequest,
} from "../../../marketplace/_shared";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const session = await getAccessTokenOrResponse();
  if (!session.ok) return session.unauthorized;
  const response = await proxyJsonRequest(`/category/${id}`, "GET", session.accessToken);
  const text = await response.text();
  const data = text ? (JSON.parse(text) as { postImages?: string[] }) : {};
  return NextResponse.json({ postImages: data.postImages ?? [] }, { status: response.status });
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const session = await getAccessTokenOrResponse();
  if (!session.ok) return session.unauthorized;
  const formData = await req.formData();
  return proxyMultipartRequest(
    `/category/${id}/post-images`,
    "POST",
    session.accessToken,
    formData,
  );
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const session = await getAccessTokenOrResponse();
  if (!session.ok) return session.unauthorized;
  const body = await req.json();
  return proxyJsonRequest(
    `/category/${id}/post-images`,
    "PATCH",
    session.accessToken,
    body,
  );
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const session = await getAccessTokenOrResponse();
  if (!session.ok) return session.unauthorized;
  const body = await req.json();
  return proxyJsonRequest(
    `/category/${id}/post-images`,
    "DELETE",
    session.accessToken,
    body,
  );
}
