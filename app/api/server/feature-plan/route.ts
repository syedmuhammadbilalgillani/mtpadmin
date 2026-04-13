import type { NextRequest } from "next/server";
import {
  getAccessTokenOrResponse,
  proxyJsonRequest,
} from "../marketplace/_shared";

export async function GET() {
  const session = await getAccessTokenOrResponse();
  if (!session.ok) return session.unauthorized;
  return proxyJsonRequest("/feature-plan", "GET", session.accessToken);
}

export async function POST(req: NextRequest) {
  const session = await getAccessTokenOrResponse();
  if (!session.ok) return session.unauthorized;
  const body = await req.json();
  return proxyJsonRequest("/feature-plan", "POST", session.accessToken, body);
}
