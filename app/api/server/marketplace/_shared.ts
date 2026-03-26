import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

function backendBaseUrl() {
  const baseUrl = process.env.AUTH_API_URL ?? "http://localhost:3000";
  return baseUrl.replace(/\/$/, "");
}

export async function getAccessTokenOrResponse() {
  const session = await getServerSession(authOptions);
  const accessToken = session?.accessToken;
  if (!accessToken) {
    return {
      ok: false as const,
      unauthorized: NextResponse.json({ message: "Unauthorized" }, { status: 401 }) as Response,
    };
  }
  return { ok: true as const, accessToken };
}

export async function proxyJsonRequest(
  path: string,
  method: "GET" | "POST" | "PATCH" | "DELETE",
  accessToken: string,
  body?: unknown,
) {
  const url = `${backendBaseUrl()}${path}`;
  const res = await fetch(url, {
    method,
    headers: {
      authorization: `Bearer ${accessToken}`,
      ...(body !== undefined ? { "content-type": "application/json" } : {}),
    },
    cache: "no-store",
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: {
      "content-type": res.headers.get("content-type") ?? "application/json",
    },
  });
}

