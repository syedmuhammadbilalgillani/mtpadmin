import type { NextRequest } from "next/server";
import {
  getAccessTokenOrResponse,
  proxyJsonRequest,
} from "../../../../marketplace/_shared";

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string; featuredId: string }> },
) {
  const session = await getAccessTokenOrResponse();
  if (!session.ok) return session.unauthorized;
  const { id, featuredId } = await ctx.params;
  const body = await req.json();
  return proxyJsonRequest(
    `/post/${id}/features/${featuredId}`,
    "PATCH",
    session.accessToken,
    body,
  );
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string; featuredId: string }> },
) {
  const session = await getAccessTokenOrResponse();
  if (!session.ok) return session.unauthorized;
  const { id, featuredId } = await ctx.params;
  return proxyJsonRequest(
    `/post/${id}/features/${featuredId}`,
    "DELETE",
    session.accessToken,
  );
}
