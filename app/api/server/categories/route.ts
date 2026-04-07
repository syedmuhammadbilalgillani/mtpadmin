import { NextRequest } from "next/server";

import {
  getAccessTokenOrResponse,
  proxyJsonRequest,
  proxyMultipartRequest,
} from "../marketplace/_shared";

export async function GET() {
  const session = await getAccessTokenOrResponse();
  if (!session.ok) return session.unauthorized;
  return proxyJsonRequest("/categories", "GET", session.accessToken);
}

export async function POST(req: NextRequest) {
  const session = await getAccessTokenOrResponse();
  if (!session.ok) return session.unauthorized;

  const formData = await req.formData();
  return proxyMultipartRequest("/categories", "POST", session.accessToken, formData);
}

