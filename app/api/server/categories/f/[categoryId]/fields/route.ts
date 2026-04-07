import { NextRequest } from "next/server";

import { getAccessTokenOrResponse, proxyJsonRequest } from "../../../../marketplace/_shared";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ categoryId: string }> },
) {
  const { categoryId } = await context.params;
  const session = await getAccessTokenOrResponse();
  if (!session.ok) return session.unauthorized;

  const body = await req.json();
  return proxyJsonRequest(`/categories/${categoryId}/fields`, "POST", session.accessToken, body);
}

