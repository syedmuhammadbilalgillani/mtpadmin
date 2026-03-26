import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const accessToken = session?.accessToken;

  if (!accessToken) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const qs = new URLSearchParams();
  for (const key of ["page", "limit", "search", "role", "status", "cityId"]) {
    const v = searchParams.get(key);
    if (v) qs.set(key, v);
  }

  const baseUrl = process.env.AUTH_API_URL ?? "http://localhost:3000";
  const url = `${baseUrl.replace(/\/$/, "")}/users?${qs.toString()}`;

  const res = await fetch(url, {
    headers: { authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: {
      "content-type": res.headers.get("content-type") ?? "application/json",
    },
  });
}

