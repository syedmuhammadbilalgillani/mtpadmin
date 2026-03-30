import { NextRequest } from "next/server";

import { getAccessTokenOrResponse, proxyJsonRequest } from "../../marketplace/_shared";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const session = await getAccessTokenOrResponse();
  if (!session.ok) return session.unauthorized;
  return proxyJsonRequest(`/admin/city/${id}`, "GET", session.accessToken);
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const session = await getAccessTokenOrResponse();
  if (!session.ok) return session.unauthorized;

  const body = await req.json();
  return proxyJsonRequest(`/admin/city/${id}`, "PATCH", session.accessToken, body);
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const session = await getAccessTokenOrResponse();
  if (!session.ok) return session.unauthorized;
  return proxyJsonRequest(`/admin/city/${id}`, "DELETE", session.accessToken);
}

