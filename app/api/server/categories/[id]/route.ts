import { NextRequest } from "next/server";
import {
  getAccessTokenOrResponse,
  proxyJsonRequest,
  proxyMultipartRequest,
} from "../../marketplace/_shared";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const session = await getAccessTokenOrResponse();
  if (!session.ok) return session.unauthorized;
  return proxyJsonRequest(`/category/${id}`, "GET", session.accessToken);
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const session = await getAccessTokenOrResponse();
  if (!session.ok) return session.unauthorized;

  const contentType = req.headers.get("content-type") ?? "";
  if (contentType.includes("multipart/form-data")) {
    const body = await req.formData();
    return proxyMultipartRequest(`/category/${id}`, "PATCH", session.accessToken, body);
  }

  const body = await req.json();
  return proxyJsonRequest(`/category/${id}`, "PATCH", session.accessToken, body);
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const session = await getAccessTokenOrResponse();
  if (!session.ok) return session.unauthorized;
  return proxyJsonRequest(`/category/${id}`, "DELETE", session.accessToken);
}
