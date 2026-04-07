import { NextRequest } from "next/server";

import { getAccessTokenOrResponse, proxyJsonRequest } from "../marketplace/_shared";

export async function GET(req: NextRequest) {
  const session = await getAccessTokenOrResponse();
  if (!session.ok) return session.unauthorized;

  const url = new URL(req.url);
  const qs = url.searchParams.toString();
  const path = qs ? `/post?${qs}` : "/post";
  return proxyJsonRequest(path, "GET", session.accessToken);
}

export async function POST(req: NextRequest) {
  const session = await getAccessTokenOrResponse();
  if (!session.ok) return session.unauthorized;

  const body = await req.json();
  return proxyJsonRequest("/post", "POST", session.accessToken, body);
}

