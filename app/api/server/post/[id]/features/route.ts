import type { NextRequest } from "next/server";
import {
    getAccessTokenOrResponse,
    proxyJsonRequest,
} from "../../../marketplace/_shared";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await getAccessTokenOrResponse();
  if (!session.ok) return session.unauthorized;
  const { id } = await ctx.params;
  return proxyJsonRequest(`/post/${id}/features`, "GET", session.accessToken);
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await getAccessTokenOrResponse();
  if (!session.ok) return session.unauthorized;
  const { id } = await ctx.params;
  const body = await req.json();
  return proxyJsonRequest(
    `/post/${id}/features`,
    "POST",
    session.accessToken,
    body,
  );
}
