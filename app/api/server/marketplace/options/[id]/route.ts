import { NextRequest } from "next/server";
import { getAccessTokenOrResponse, proxyJsonRequest } from "../../_shared";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const session = await getAccessTokenOrResponse();
  if (!session.ok) return session.unauthorized;
  const body = await req.json();
  return proxyJsonRequest(
    `/admin/marketplace/options/${id}`,
    "PATCH",
    session.accessToken,
    body,
  );
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const session = await getAccessTokenOrResponse();
  if (!session.ok) return session.unauthorized;
  return proxyJsonRequest(
    `/admin/marketplace/options/${id}`,
    "DELETE",
    session.accessToken,
  );
}

