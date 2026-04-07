import { NextRequest } from "next/server";

import { getAccessTokenOrResponse, proxyJsonRequest } from "../../../marketplace/_shared";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ fieldId: string }> },
) {
  const { fieldId } = await context.params;
  const session = await getAccessTokenOrResponse();
  if (!session.ok) return session.unauthorized;

  const body = await req.json();
  return proxyJsonRequest(`/categories/fields/${fieldId}`, "PATCH", session.accessToken, body);
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ fieldId: string }> },
) {
  const { fieldId } = await context.params;
  const session = await getAccessTokenOrResponse();
  if (!session.ok) return session.unauthorized;

  return proxyJsonRequest(`/categories/fields/${fieldId}`, "DELETE", session.accessToken);
}

