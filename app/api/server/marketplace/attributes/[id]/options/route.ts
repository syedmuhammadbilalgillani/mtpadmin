import { NextRequest } from "next/server";
import { getAccessTokenOrResponse, proxyJsonRequest } from "../../../_shared";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const session = await getAccessTokenOrResponse();
  if (!session.ok) return session.unauthorized;
  const body = await req.json();
  return proxyJsonRequest(
    `/admin/marketplace/attributes/${id}/options`,
    "POST",
    session.accessToken,
    body,
  );
}

