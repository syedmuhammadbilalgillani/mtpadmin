import { NextRequest } from "next/server";
import {
  getAccessTokenOrResponse,
  proxyJsonRequest,
  proxyMultipartRequest,
} from "../marketplace/_shared";

export async function GET() {
  const session = await getAccessTokenOrResponse();
  if (!session.ok) return session.unauthorized;
  return proxyJsonRequest("/category", "GET", session.accessToken);
}

export async function POST(req: NextRequest) {
  const session = await getAccessTokenOrResponse();
  if (!session.ok) return session.unauthorized;

  const contentType = req.headers.get("content-type") ?? "";
  if (contentType.includes("multipart/form-data")) {
    const body = await req.formData();
    return proxyMultipartRequest("/category", "POST", session.accessToken, body);
  }

  const body = await req.json();
  return proxyJsonRequest("/category", "POST", session.accessToken, body);
}
