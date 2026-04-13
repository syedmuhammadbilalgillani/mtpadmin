import type { NextRequest } from "next/server";
import {
  getAccessTokenOrResponse,
  proxyJsonRequest,
} from "../../marketplace/_shared";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await getAccessTokenOrResponse();
  if (!session.ok) return session.unauthorized;
  const { id } = await ctx.params;
  return proxyJsonRequest(`/feature-plan/${id}`, "GET", session.accessToken);
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await getAccessTokenOrResponse();
  if (!session.ok) return session.unauthorized;
  const { id } = await ctx.params;
  const body = await req.json();
  return proxyJsonRequest(
    `/feature-plan/${id}`,
    "PATCH",
    session.accessToken,
    body,
  );
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await getAccessTokenOrResponse();
  if (!session.ok) return session.unauthorized;
  const { id } = await ctx.params;
  return proxyJsonRequest(`/feature-plan/${id}`, "DELETE", session.accessToken);
}
