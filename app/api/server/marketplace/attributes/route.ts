import { NextRequest } from "next/server";
import { getAccessTokenOrResponse, proxyJsonRequest } from "../_shared";

export async function GET() {
  const session = await getAccessTokenOrResponse();
  if (!session.ok) return session.unauthorized;
  return proxyJsonRequest(
    "/admin/marketplace/attributes",
    "GET",
    session.accessToken,
  );
}

export async function POST(req: NextRequest) {
  const session = await getAccessTokenOrResponse();
  if (!session.ok) return session.unauthorized;
  const body = await req.json();
  return proxyJsonRequest(
    "/admin/marketplace/attributes",
    "POST",
    session.accessToken,
    body,
  );
}

