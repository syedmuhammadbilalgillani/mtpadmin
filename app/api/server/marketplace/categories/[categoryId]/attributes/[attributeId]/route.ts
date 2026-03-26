import { NextRequest } from "next/server";
import { getAccessTokenOrResponse, proxyJsonRequest } from "../../../../_shared";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ categoryId: string; attributeId: string }> },
) {
  const { categoryId, attributeId } = await context.params;
  const session = await getAccessTokenOrResponse();
  if (!session.ok) return session.unauthorized;
  const body = await req.json();
  return proxyJsonRequest(
    `/admin/marketplace/categories/${categoryId}/attributes/${attributeId}`,
    "POST",
    session.accessToken,
    body,
  );
}

