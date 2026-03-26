import { NextResponse } from "next/server";

type RegisterAdminBody = {
  email: string;
  phone: string;
  password: string;
  fullName: string;
  cityId?: string;
  isCompany?: boolean;
  adminRegisterKey: string;
};

export async function POST(req: Request) {
  const body = (await req.json()) as Partial<RegisterAdminBody>;

  if (!body.email || !body.phone || !body.password || !body.fullName || !body.adminRegisterKey) {
    return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
  }

  const baseUrl = process.env.AUTH_API_URL ?? "http://localhost:3000";
  const url = `${baseUrl.replace(/\/$/, "")}/auth/register-admin`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-admin-register-key": body.adminRegisterKey,
    },
    body: JSON.stringify({
      email: body.email,
      phone: body.phone,
      password: body.password,
      fullName: body.fullName,
      cityId: body.cityId,
      isCompany: body.isCompany ?? false,
    }),
  });

  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: {
      "content-type": res.headers.get("content-type") ?? "application/json",
    },
  });
}

